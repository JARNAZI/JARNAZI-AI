import { redirect } from 'next/navigation';

export default async function PlansRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/buy-tokens`);
}
