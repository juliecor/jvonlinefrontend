import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentAdmin } from "@/lib/admin-auth"
import { AdminLoginForm } from "./login-form"

export const metadata: Metadata = { title: "Admin sign in · jvonline", robots: { index: false, follow: false } }

/** jvconline.ph/admin/login — the main admin's door. Realties and agents get their own, branded ones. */
export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect("/admin")

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight">jvonline</p>
          <p className="mt-1 text-sm text-slate-500">Admin</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] sm:p-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  )
}
