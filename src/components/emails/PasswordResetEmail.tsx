import * as React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface PasswordResetEmailProps {
    actionUrl: string;
}

export default function PasswordResetEmail({ actionUrl }: PasswordResetEmailProps) {
    return (
        <EmailLayout preview="Reset your password">
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Reset your password
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                We received a request to reset your password. If you didn&apos;t make this request, you can safely ignore this email.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-accentColor rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    Reset Password
                </Button>
            </Section>
        </EmailLayout>
    );
}
