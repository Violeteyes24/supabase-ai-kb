import Messages from './messages';

export default function Login() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-zinc-100">Welcome back</h2>
          <p className="text-sm text-zinc-400">Sign in to your account to continue</p>
        </div>

        <form
          className="flex flex-col gap-4"
          action="/auth/sign-in"
          method="post"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              className="rounded-lg px-3 py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all text-sm"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              className="rounded-lg px-3 py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all text-sm"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-sm transition-colors">
              Sign In
            </button>
            <button
              formAction="/auth/sign-up"
              className="w-full py-2.5 px-4 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition-colors"
            >
              Create Account
            </button>
          </div>

          <Messages />
        </form>
      </div>
    </div>
  );
}
