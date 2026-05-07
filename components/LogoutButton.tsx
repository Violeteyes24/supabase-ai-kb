export default function LogoutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button className="px-3 py-1.5 text-sm rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors">
        Sign out
      </button>
    </form>
  );
}
