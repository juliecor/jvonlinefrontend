import { type Account, AccountSettings } from "@/components/account-settings"
import { PageHeader } from "@/components/dashboard-ui"
import { requireAdmin } from "@/lib/admin-auth"
import { api } from "@/lib/api"
import { changePassword, saveDetails } from "./actions"

export const metadata = { title: "My account" }

/** jvconline.ph/admin/account — the platform admin's own name, email, phone and password. */
export default async function AdminAccountPage() {
  const { token } = await requireAdmin()
  const account = await api<Account>("/account", { token })

  return (
    <div>
      <PageHeader eyebrow="Account" title="My account" lede="Your name, email, mobile number and password. Only you can change them." />
      <div className="mt-8">
        <AccountSettings account={account} save={saveDetails} changePassword={changePassword} />
      </div>
    </div>
  )
}
