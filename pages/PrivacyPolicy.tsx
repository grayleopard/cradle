import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = 'January 5, 2025';

  return (
    <div className="min-h-full bg-[#FFFCF9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8DDD4] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[#F5EDE6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <p className="text-sm text-[#6B5D52] mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Introduction</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              Pipit ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              marketplace platform for buying and selling baby and children's items.
            </p>
            <p className="text-[#4A3F37] leading-relaxed">
              By using Pipit, you consent to the data practices described in this policy. If you do not
              agree with our policies, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Information We Collect</h2>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Information You Provide</h3>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, profile photo, location (ZIP code)</li>
              <li><strong>Profile Information:</strong> Bio, neighborhood, children's ages, parenting interests</li>
              <li><strong>Listing Information:</strong> Item descriptions, photos, prices, condition details</li>
              <li><strong>Transaction Information:</strong> Purchase history, payment details (processed by Stripe)</li>
              <li><strong>Communications:</strong> Messages between users, support requests</li>
              <li><strong>Verification Information:</strong> ID documents (processed by Stripe Identity), social account connections</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li><strong>Device Information:</strong> Device type, operating system, browser type</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, search queries, time spent</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address or device GPS (with permission)</li>
              <li><strong>Cookies:</strong> Session cookies for authentication, preference cookies for settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">How We Use Your Information</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Provide and maintain the Service</li>
              <li>Process transactions and send related information</li>
              <li>Facilitate communication between buyers and sellers</li>
              <li>Verify user identity and build trust signals</li>
              <li>Personalize your experience and show relevant listings</li>
              <li>Send transactional emails (order confirmations, messages, etc.)</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Detect and prevent fraud, abuse, and security issues</li>
              <li>Comply with legal obligations</li>
              <li>Improve and develop new features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">How We Share Your Information</h2>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">With Other Users</h3>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              When you create a listing or engage in a transaction, certain information is shared with
              other users, including your name, profile photo, trust badges, ratings, and approximate location.
            </p>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">With Service Providers</h3>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li><strong>Stripe:</strong> Payment processing and identity verification</li>
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Cloudinary:</strong> Image hosting and processing</li>
              <li><strong>Google:</strong> AI services for safety checks and features</li>
              <li><strong>Analytics providers:</strong> To understand usage patterns</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">For Legal Reasons</h3>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              We may disclose information if required by law, court order, or government request,
              or to protect our rights, safety, or property.
            </p>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Business Transfers</h3>
            <p className="text-[#4A3F37] leading-relaxed">
              If Pipit is involved in a merger, acquisition, or sale of assets, your information may
              be transferred as part of that transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Data Retention</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              We retain your information for as long as your account is active or as needed to provide
              services. After account deletion:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Profile information is deleted within 30 days</li>
              <li>Transaction records are retained for 7 years for legal/tax purposes</li>
              <li>Anonymized usage data may be retained indefinitely</li>
              <li>Backups are purged within 90 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Your Rights and Choices</h2>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Access and Portability</h3>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You can access and download your data through your profile settings. We will provide
              your data in a portable format within 30 days of request.
            </p>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Correction</h3>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You can update your profile information at any time through the app.
            </p>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Deletion</h3>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You can delete your account through profile settings. This will remove your profile,
              listings, and messages. Some information may be retained as required by law.
            </p>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Marketing Communications</h3>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You can opt out of marketing emails by clicking "unsubscribe" in any email or through
              your notification settings. Transactional emails cannot be opted out.
            </p>

            <h3 className="text-lg font-semibold text-[#4A3F37] mb-3 mt-6">Location Data</h3>
            <p className="text-[#4A3F37] leading-relaxed">
              You can disable location services through your device settings. Note that this may
              affect features like distance-based search.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">California Privacy Rights (CCPA)</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              California residents have additional rights under the CCPA:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li><strong>Right to Know:</strong> What personal information we collect and how it's used</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to Opt-Out:</strong> We do not sell personal information</li>
              <li><strong>Right to Non-Discrimination:</strong> We won't discriminate against you for exercising your rights</li>
            </ul>
            <p className="text-[#4A3F37] leading-relaxed">
              To exercise these rights, contact us at privacy@pipit.app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Children's Privacy</h2>
            <p className="text-[#4A3F37] leading-relaxed">
              Pipit is not intended for users under 18 years old. We do not knowingly collect
              information from children. If we learn we have collected information from a child
              under 18, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Security</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Encryption in transit (HTTPS) and at rest</li>
              <li>Secure authentication with password hashing</li>
              <li>Regular security audits and monitoring</li>
              <li>Employee access controls and training</li>
            </ul>
            <p className="text-[#4A3F37] leading-relaxed">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee
              absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">International Data Transfers</h2>
            <p className="text-[#4A3F37] leading-relaxed">
              Your information may be transferred to and processed in the United States or other
              countries where our service providers operate. By using Pipit, you consent to this transfer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Third-Party Links</h2>
            <p className="text-[#4A3F37] leading-relaxed">
              Our Service may contain links to third-party websites. We are not responsible for the
              privacy practices of these sites. We encourage you to read their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Changes to This Policy</h2>
            <p className="text-[#4A3F37] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes via email or through the Service. The "Last updated" date at the top indicates
              when the policy was last revised.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">Contact Us</h2>
            <p className="text-[#4A3F37] leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="text-[#4A3F37] leading-relaxed mt-2">
              <strong>Email:</strong> privacy@pipit.app<br />
              <strong>Address:</strong> Pipit Inc., Auburn, WA 98001
            </p>
            <p className="text-[#4A3F37] leading-relaxed mt-4">
              For data deletion requests or to exercise your privacy rights, please email
              privacy@pipit.app with "Privacy Request" in the subject line.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
