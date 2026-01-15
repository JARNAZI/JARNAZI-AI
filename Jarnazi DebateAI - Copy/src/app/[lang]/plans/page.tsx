import { redirect } from 'next/navigation';

export default function PlansRedirect({ params }: { params: { lang: string } }) {
  redirect(`/${params.lang}/buy-tokens`);
}
