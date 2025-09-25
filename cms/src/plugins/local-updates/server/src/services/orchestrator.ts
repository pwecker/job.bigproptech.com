import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';

const execAsync = util.promisify(exec);

interface WorkflowResource {
  start(): Promise<{ url: string; id: string }>;
  stop(id: string): Promise<void>;
  run(url: string, flow: any[]): Promise<any>;
  isHealthy?(url: string, containerId?: string): Promise<boolean>;
}

abstract class BaseResource implements WorkflowResource {
  abstract start(): Promise<{ id: string; url: string }>;
  abstract stop(id: string): Promise<void>;

  async run(url: string, flow: any): Promise<any> {
    const res = await axios.post(url, flow);
    return res.data;
  }

  async isHealthy(url: string, containerId?: string): Promise<boolean> {
    try {
      await axios.get(`${url}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

class DockerResource extends BaseResource {
  private image = process.env.NESTJS_IMAGE || 'nestjs:latest';

  async start() {
    const containerName = `nestjs_${Date.now()}`;

    const { stdout } = await execAsync(
      `docker run -d -P --rm --name ${containerName} \
       --network nest-net \
       -e REDIS_HOST=host.docker.internal \
       -e REDIS_PORT=6379 \
       -e MONGODB_URI=mongodb://host.docker.internal:27017/nest \
       ${this.image}`
    );
    
    const containerId = stdout.trim();

    const { stdout: inspectOutput } = await execAsync(`docker inspect ${containerId}`);
    const inspect = JSON.parse(inspectOutput);
    const portInfo = inspect[0].NetworkSettings.Ports["3000/tcp"];
    if (!portInfo || portInfo.length === 0) {
      throw new Error("Container did not publish port 3000");
    }

    const hostPort = portInfo[0].HostPort;
    const url = `http://localhost:${hostPort}`;

    // Wait for container to be ready
    for (let i = 0; i < 20; i++) {
      try {
        await axios.get(url, { timeout: 2000 });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return { url, id: containerId };
  }

  async stop(id: string) {
    try {
      await execAsync(`docker stop ${id} && docker rm ${id}`);
      console.log(`Docker container stopped: ${id}`);
    } catch (error) {
      console.error(`Failed to stop container ${id}:`, error);
    }
  }

  async isHealthy(url: string, containerId?: string): Promise<boolean> {
    try {
      // First check if the container is still running (if we have the container ID)
      if (containerId) {
        await execAsync(`docker inspect ${containerId}`);
      }
      
      // Then check if the service responds to HTTP requests
      return await super.isHealthy(url);
    } catch {
      return false;
    }
  }
}

class RailwayResource extends BaseResource {
  private serviceId = process.env.RAILWAY_SERVICE_ID;
  private baseUrl = process.env.RAILWAY_SERVICE_URL;

  async start() {
    if (!this.baseUrl) {
      throw new Error('RAILWAY_SERVICE_URL must be set to your deployed service URL');
    }

    const url = this.baseUrl;

    try {
      await axios.get(`${url}/health`, { timeout: 30000 });
      console.log(`Railway service is awake: ${url}`);
    } catch (error) {
      console.log('Health check failed, attempting to wake service...');
      try {
        await axios.get(url, { timeout: 30000 });
      } catch {
        throw new Error('Failed to wake up Railway service');
      }
    }

    return { 
      url, 
      id: `railway-${this.serviceId}-${Date.now()}` 
    };
  }

  async stop(id: string) {
    console.log(`Railway service will auto-sleep when idle: ${id}`);
  }

  async isHealthy(url: string): Promise<boolean> {
    return await super.isHealthy(url);
  }
}

export default () => {
  let current: { url: string; id: string } | null = null;
  let resource: WorkflowResource;

  function getResource(): WorkflowResource {
    if (!resource) {
      const driver = process.env.ORCHESTRATOR_DRIVER || 'docker';
      resource = driver === 'railway' ? new RailwayResource() : new DockerResource();
    }
    return resource;
  }

  return {
    async ensureStarted(): Promise<{ url: string; id: string }> {
      const r = getResource();
      
      // If we have a current resource, check if it's still healthy
      if (current) {
        const isHealthy = r.isHealthy ? await r.isHealthy(current.url, current.id) : true;
        if (isHealthy) {
          console.log(`Reusing existing resource: ${current.url}`);
          return current;
        } else {
          console.log(`Current resource unhealthy, cleaning up: ${current.id}`);
          try {
            await r.stop(current.id);
          } catch (error) {
            console.error('Failed to cleanup unhealthy resource:', error);
          }
          current = null;
        }
      }

      // start
      current = await r.start();
      return current;
    },

    async runWorkflow(workflow: any): Promise<any> {
      const resource = getResource();
      
      // Use ensureStarted instead of directly calling start()
      const { url, id } = await this.ensureStarted();
      
      try {
        const result = await resource.run(url, workflow);
        return { 
          workflowId: result.workflowId ?? result, 
          containerId: id, 
          url 
        };
      } catch (error) {
        console.error('Workflow execution failed:', error);
        
        // If the workflow fails, the resource might be unhealthy
        // Reset current so next call will start fresh
        if (current && current.id === id) {
          console.log('Marking resource as potentially unhealthy after workflow failure');
          // Don't immediately stop it, let the health check handle it next time
        }
        
        throw error;
      }
    },

    async stop() {
      if (current) {
        const r = getResource();
        console.log(`Stopping resource: ${current.id}`);
        try {
          await r.stop(current.id);
        } catch (error) {
          console.error('Failed to stop resource:', error);
        }
        current = null;
      }
    },

    // Utility method to get current resource info without starting one
    getCurrentResource(): { url: string; id: string } | null {
      return current;
    },

    // Method to force restart of current resource
    async restart(): Promise<{ url: string; id: string }> {
      await this.stop();
      return await this.ensureStarted();
    }
  };
};