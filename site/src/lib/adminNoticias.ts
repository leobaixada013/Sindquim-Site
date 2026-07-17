import { createDirectus, rest, readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? import.meta.env?.DIRECTUS_URL ?? 'http://localhost:8055';

function clienteComToken(token: string) {
  return createDirectus(DIRECTUS_URL).with(rest()).with(client => {
    return {
      request: (req: any) => {
         return client.request(req, {
           headers: { Authorization: `Bearer ${token}` }
         });
      }
    };
  });
}

export async function listarAdminPosts(token: string) {
  const cliente = createDirectus(DIRECTUS_URL).with(rest());
  return cliente.request(readItems('posts', {
    sort: ['-date_created'],
    limit: 50,
  }), { headers: { Authorization: `Bearer ${token}` } });
}

export async function getAdminPost(token: string, id: string | number) {
  const cliente = createDirectus(DIRECTUS_URL).with(rest());
  return cliente.request(readItem('posts', id as number), { headers: { Authorization: `Bearer ${token}` } });
}
