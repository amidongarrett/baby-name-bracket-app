import { redirect } from 'next/navigation';

// Tournament bracket has moved to the home page.
export default function TournamentPage() {
  redirect('/');
}
