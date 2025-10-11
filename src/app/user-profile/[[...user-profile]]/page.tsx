import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-200/50 shadow-xl">
          <UserProfile 
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                card: "shadow-none",
                navbar: "bg-gray-50 rounded-xl",
                navbarButton: "text-gray-600 hover:bg-blue-50 hover:text-blue-600",
                navbarButtonActive: "bg-blue-100 text-blue-700",
                formFieldInput: "border-gray-200 focus:border-blue-600 focus:ring-blue-600",
                footerActionLink: "text-blue-600 hover:text-blue-700"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}