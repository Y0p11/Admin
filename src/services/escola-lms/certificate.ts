import { request } from 'umi';
import type { RequestOptionsInit } from 'umi-request';

/**  GET /api/admin/templates/assignable */
export async function assignable(
  params?: EscolaLms.Templates.Http.Requests.TemplateListAssignableRequest,
  options?: RequestOptionsInit,
) {
  return request<API.DefaultMetaResponse<API.Certificate>>('/api/admin/templates/assignable', {
    method: 'GET',
    /* useCache: true */ useCache: false,
    params,
    ...(options || {}),
  });
}

export async function assign(
  id: number,
  body: { assignable_id: number },
  options?: RequestOptionsInit,
) {
  return request<API.CourseAccessList>(`/api/admin/templates/${id}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function unassign(
  id: number,
  body: { assignable_id: number },
  options?: RequestOptionsInit,
) {
  return request<API.CourseAccessList>(`/api/admin/templates/${id}/unassign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/**  GET /api/admin/templates/assigned */
export async function assigned(params: API.TemplateItem, options?: RequestOptionsInit) {
  return request<API.DefaultResponse<API.Certificate[]>>(`/api/admin/templates/assigned`, {
    params,
    method: 'GET',
    /* useCache: true */ useCache: false,
    ...(options || {}),
  });
}
