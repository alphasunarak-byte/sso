import { redirect } from 'next/navigation';

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const queryString = params
    ? new URLSearchParams(
        Object.entries(params).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((item) => [k, item]) : v ? [[k, v]] : []
        )
      ).toString()
    : '';

  redirect(queryString ? `/login?${queryString}` : '/login');
}
