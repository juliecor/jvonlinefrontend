import { type Account, AccountSettings } from "@/components/account-settings"
import { PageHeader } from "@/components/dashboard-ui"
import { api } from "@/lib/api"
import { requireRealtyUser } from "@/lib/realty-auth"
import { changePassword, saveDetails } from "./actions"

export const metadata = { title: "My account" }

/** jvconline.ph/<realty>/dashboard/account — your own name, email, phone and password. */
export default async function AccountPage({ params }: { params: Promise<{ realty: string }> }) {
  const { realty: slug } = await params
  const { token } = await requireRealtyUser(slug)
  const account = await api<Account>("/account", { token })

  return (
    <div>
      <PageHeader eyebrow="Account" title="My account" lede="Your name, email, mobile number and password. Only you can change them." />
      <div className="mt-8">
        <AccountSettings
          account={account}
          buyersSee="Buyers see your name and email on the offers you send, and their answers come to this email."
          save={saveDetails.bind(null, slug)}
          changePassword={changePassword.bind(null, slug)}
        />
      </div>
    </div>
  )
}
