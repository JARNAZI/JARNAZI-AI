import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Preview,
  Tailwind,
  Hr,
} from '@react-email/components';

interface EmailLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jarnazi.com';

export default function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                mainBackground: '#f4f4f5',
                containerBackground: '#ffffff',
                textColor: '#18181b',
                mutedColor: '#71717a',
                accentColor: '#4f46e5',
                borderColor: '#e4e4e7',
              },
            },
          },
        }}
      >
        <Body className="bg-mainBackground my-auto mx-auto font-sans">
          <Container className="border border-solid border-borderColor rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-containerBackground">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="40"
                alt="Jarnazi DebateAI"
                className="my-0 mx-auto rounded-lg"
              />
              <Text className="text-center text-[24px] font-bold text-textColor mt-[16px] mb-0">
                Jarnazi DebateAI
              </Text>
              <Text className="text-center text-[14px] text-mutedColor mt-[4px]">
                 The Council Has Spoken
              </Text>
            </Section>
            
            <Section className="px-[32px] py-[20px]">
              {children}
            </Section>

            <Hr className="border border-solid border-borderColor my-[26px] mx-0 w-full" />

            <Section>
              <Text className="text-[12px] leading-[24px] text-mutedColor text-center">
                © {new Date().getFullYear()} Jarnazi DebateAI. All rights reserved.
              </Text>
              <Text className="text-[12px] leading-[24px] text-mutedColor text-center">
                <Link href={`${baseUrl}/privacy`} className="text-mutedColor underline">Privacy</Link>
                {' • '}
                <Link href={`${baseUrl}/terms`} className="text-mutedColor underline">Terms</Link>
                {' • '}
                <Link href={`${baseUrl}/support`} className="text-mutedColor underline">Support</Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
