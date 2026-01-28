import { getDictionary } from '@/i18n/get-dictionary';
import BuyTokensClient from "./BuyTokensClient";

export default async function Page(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const dict = await getDictionary(params.lang);
  return <BuyTokensClient lang={params.lang} dict={dict} />;
}

