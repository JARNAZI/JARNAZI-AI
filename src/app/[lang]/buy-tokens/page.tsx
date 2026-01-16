import BuyTokensClient from "./BuyTokensClient";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <BuyTokensClient lang={lang} />;
}
