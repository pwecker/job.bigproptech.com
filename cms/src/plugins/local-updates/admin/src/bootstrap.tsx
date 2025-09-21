import { useState } from 'react';
import { DataButton } from './components/DataButton';
import { UpdateStatus } from './components/UpdateStatus';
import { unstable_useContentManagerContext } from '@strapi/strapi/admin';

const TARGET_UID = 'api::segment.segment';

const bootstrap = (app: any) => {
  app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
    name: 'local-updates-actions',
    Component: () => {
      const { slug } = unstable_useContentManagerContext() as any;

      if (slug !== TARGET_UID) {
        return null;
      }

      const [result, setResult] = useState<any>(null);
      const [error, setError] = useState<string | null>(null);
      const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
      const [orchestratorStatus, setOrchestratorStatus] = useState<{
        url?: string;
        containerId?: string;
        shouldPoll?: boolean;
      }>({});

      const handleResult = (res: any) => {
        setResult(res);
        setError(null);
        setLastUpdated(new Date());

        if (res?.url && res?.containerId) {
          setOrchestratorStatus({
            url: res.url,
            containerId: res.containerId,
            shouldPoll: true
          });
        }
      };

      const handleError = (err: string) => {
        setError(err);
        setResult(null);
        setLastUpdated(new Date());
        setOrchestratorStatus(prev => ({ ...prev, shouldPoll: false }));
      };

      const buildSyncPayload = (values: any, actionType: string) => ({
        type: actionType,
        payload: { map: values.map },
      });

      const buildUpdatePayload = (values: any, actionType: string) => ({
        type: actionType,
        payload: { config: values.config },
      });

      const buildTagPayload = (values: any, actionType: string) => ({
        type: actionType,
        payload: {},
      });

      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 'auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '1rem', alignItems: 'center' }}>
            <DataButton label="Sync" actionType="sync" onResult={handleResult} onError={handleError} payloadBuilder={buildSyncPayload}/>
            <DataButton label="Update" actionType="update" onResult={handleResult} onError={handleError} payloadBuilder={buildUpdatePayload}/>
            <DataButton label="Tag" actionType="tag" onResult={handleResult} onError={handleError} payloadBuilder={buildTagPayload}/>
          </div>
          <UpdateStatus 
            result={result} 
            error={error} 
            lastUpdated={lastUpdated}
            orchestratorStatus={orchestratorStatus}
          />
        </div>
      );
    }
  });
};

export default bootstrap;