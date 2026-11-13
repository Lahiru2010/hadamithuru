// components/AuthCard.tsx
// Login / Register / Forgot password pages වලට පොදු card layout එක
export default function AuthCard({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 dark:bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="flex-1 flex items-center justify-center p-4 py-10 relative z-10">
        <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-[2rem] border border-border/50 bg-background/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-primary/5`}>
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

/** Form input එකක පොදු style එක */
export const authInputClass =
  "w-full rounded-xl border border-border bg-background/50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

/** Primary (රෝස gradient) button එකේ style එක */
export const authButtonClass =
  "w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] py-3 font-semibold text-white hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all";
