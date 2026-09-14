import { redirect } from 'next/navigation';
import ReviewStepClient from './ReviewStepClient';

type ReviewStepPageProps = {
  searchParams: Promise<{
    registrationId?: string;
  }>;
};

export default async function ReviewStepPage({
  searchParams,
}: ReviewStepPageProps) {
  const params = await searchParams;
  const registrationId = params.registrationId;

  if (!registrationId) {
    redirect('/team/dashboard');
  }

  return (
    <ReviewStepClient
      registrationId={registrationId}
    />
  );
}