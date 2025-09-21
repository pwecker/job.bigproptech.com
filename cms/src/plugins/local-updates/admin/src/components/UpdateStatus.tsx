import React, { useState, useEffect, useCallback } from 'react';

interface UpdateStatusProps {
  result: any;
  error: string | null;
  lastUpdated: Date | null;
  orchestratorStatus?: {
    url?: string;
    containerId?: string;
    shouldPoll?: boolean;
  };
}

interface HealthStatus {
  status: 'active' | 'idle';
  uptime: number;
  timestamp: number;
  queues?: any;
}

const UpdateStatus: React.FC<UpdateStatusProps> = ({ 
  result, 
  error, 
  lastUpdated, 
  orchestratorStatus 
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchHealthStatus = useCallback(async () => {
    if (!orchestratorStatus?.url) return;

    try {
      const response = await fetch(`/api/local-updates/health?url=${encodeURIComponent(orchestratorStatus.url)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthStatus(data);
      setHealthError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setHealthError(errorMessage);
      setHealthStatus(null);
    }
  }, [orchestratorStatus?.url]);

  useEffect(() => {
    if (!orchestratorStatus?.shouldPoll || !orchestratorStatus?.url) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    
    fetchHealthStatus();

    const pollInterval = setInterval(fetchHealthStatus, 5000);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [orchestratorStatus?.shouldPoll, orchestratorStatus?.url, fetchHealthStatus]);

  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: 'active' | 'idle') => {
    return status === 'active' ? '#28a745' : '#6c757d';
  };

  const getStatusBackground = (status: 'active' | 'idle') => {
    return status === 'active' ? '#d4edda' : '#f8f9fa';
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {lastUpdated && (
        <div
          style={{
            fontSize: '12px',
            marginBottom: '0.5rem',
            color: '#666687',
          }}
        >
          Last checked: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* orchestrator status */}
      {orchestratorStatus?.url && (
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#32324d',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Orchestrator Status
            {isPolling && (
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#007bff',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite'
                }}
              />
            )}
          </div>
          
          {healthError && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fdf4f4',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#721c24',
                marginBottom: '8px'
              }}
            >
              Health check failed: {healthError}
            </div>
          )}

          {healthStatus && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: getStatusBackground(healthStatus.status),
                border: `1px solid ${getStatusColor(healthStatus.status)}`,
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: getStatusColor(healthStatus.status),
                    borderRadius: '50%'
                  }}
                />
                <strong style={{ color: getStatusColor(healthStatus.status) }}>
                  {healthStatus.status.toUpperCase()}
                </strong>
              </div>
              
              <div style={{ color: '#666687' }}>
                Uptime: {formatUptime(healthStatus.uptime)}
              </div>
              
              {orchestratorStatus.containerId && (
                <div style={{ color: '#666687', fontSize: '11px' }}>
                  ID: {orchestratorStatus.containerId.substring(0, 12)}...
                </div>
              )}
            </div>
          )}

          {!healthStatus && !healthError && isPolling && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666687'
              }}
            >
              Checking orchestrator health...
            </div>
          )}
        </div>
      )}

      {/* error */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fdf4f4',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#721c24',
            marginBottom: '1rem'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* result */}
      {result && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #32324d',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
          }}
        >
          <div
            style={{
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#32324d',
            }}
          >
            Response:
          </div>
          <pre
            style={{
              margin: 0,
              overflow: 'auto',
              maxHeight: '200px',
              color: '#32324d',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export { UpdateStatus };