import { useState } from 'react';

export function useAudits() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const createAudit = async (_data: any) => ({ data: null, error: null });
  const updateAuditStatus = async (_id: string, _status: string) => ({ data: null, error: null });
  const addPhotoToAudit = async (_id: string, _url: string) => ({ data: null, error: null });
  const refetch = async () => {};

  return { audits, loading, createAudit, updateAuditStatus, addPhotoToAudit, refetch };
}
