import * as React from 'react';
import { Section, Text, Button, Heading, Row, Column } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface PurchaseReceiptEmailProps {
    planName: string;
    amount: string;
    tokens: number;
    actionUrl: string;
}

export default function PurchaseReceiptEmail({ planName, amount, tokens, actionUrl }: PurchaseReceiptEmailProps) {
    return (
        <EmailLayout preview="Your Token Purchase Receipt">
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Receipt for your purchase
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                Thank you for your purchase. Your account has been credited with new tokens.
            </Text>

            <Section className="bg-white border text-center border-gray-200 rounded-lg p-4 my-6">
                <Text className="m-0 text-sm font-bold text-left text-gray-800">Order Details</Text>
                <Row className="mt-4 border-b border-gray-100 pb-2">
                    <Column className="text-left text-gray-600">Plan</Column>
                    <Column className="text-right font-medium text-gray-900">{planName}</Column>
                </Row>
                <Row className="mt-2 border-b border-gray-100 pb-2">
                    <Column className="text-left text-gray-600">Tokens</Column>
                    <Column className="text-right font-medium text-gray-900">{tokens}</Column>
                </Row>
                <Row className="mt-2 pt-2">
                    <Column className="text-left text-gray-800 font-bold">Total</Column>
                    <Column className="text-right font-bold text-gray-900">{amount}</Column>
                </Row>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-accentColor rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    View Billing History
                </Button>
            </Section>
        </EmailLayout>
    );
}
