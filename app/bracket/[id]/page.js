import BracketIdPage from '@/components/pages/BracketView';

export default function Page({ params, searchParams }) {
  return <BracketIdPage params={params} shareToken={searchParams?.share ?? null} />;
}
