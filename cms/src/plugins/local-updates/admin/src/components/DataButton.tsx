import React, { useState } from 'react';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { Button } from '@strapi/design-system';

const useFetchClient = () => {
  if (window.strapi?.admin?.services?.fetchClient) {
    return window.strapi.admin.services.fetchClient;
  }

  return {
    post: async (url: string, body: any) => {
      const token =
        localStorage.getItem('jwtToken') ||
        sessionStorage.getItem('jwtToken') ||
        document.cookie.split('; ').find((row) => row.startsWith('jwtToken='))?.split('=')[1];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  };
};

interface UpdateButtonProps {
  label: string;
  actionType: 'sync' | 'update' | 'tag';
  onResult: (result: any) => void;
  onError: (error: string) => void;
  payloadBuilder?: (values: any, actionType: string) => any;
}

const DataButton: React.FC<UpdateButtonProps> = ({
  label,
  actionType,
  onResult,
  onError,
  payloadBuilder
}) => {
  const { form } = useContentManagerContext() as any;
  const { values } = form;
  const { post } = useFetchClient();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!values?.documentId) {
      onError('No entity ID found');
      return;
    }

    setLoading(true);
    onError('');
    onResult(null);

    try {
      const payload = payloadBuilder?.(values, actionType) || {
        type: actionType,
        payload: values,
      };

      const response = await post(`/local-updates/${actionType}`, payload);
      onResult(response.data || response);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading || !values?.documentId} loading={loading}>
      {loading ? 'Processing...' : label}
    </Button>
  );
};

export { DataButton };
