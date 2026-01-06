import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const TermsOfService = () => {
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
          <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <p className="text-sm text-[#6B5D52] mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">1. Acceptance of Terms</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              By accessing or using Pipit ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
            <p className="text-[#4A3F37] leading-relaxed">
              Pipit is a marketplace platform that connects parents to buy and sell pre-loved baby and
              children's items. We facilitate transactions but are not a party to any transaction between
              buyers and sellers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">2. Eligibility</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You must be at least 18 years old to use Pipit. By using the Service, you represent and
              warrant that you meet this age requirement and have the legal capacity to enter into
              these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">3. Account Registration</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">4. Listing and Selling</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              When listing items for sale, you agree to:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Provide accurate descriptions and photos of items</li>
              <li>Only list items you legally own and have the right to sell</li>
              <li>Not list recalled, unsafe, counterfeit, or prohibited items</li>
              <li>Honor the price and terms of accepted offers</li>
              <li>Complete transactions in good faith</li>
            </ul>
            <p className="text-[#4A3F37] leading-relaxed">
              <strong>Prohibited Items:</strong> Recalled products, expired car seats, counterfeit goods,
              hazardous materials, stolen property, and any items prohibited by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">5. Buying</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              When purchasing items, you agree to:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Pay the agreed-upon price promptly</li>
              <li>Inspect items at meetup before confirming receipt</li>
              <li>Report any issues within 24 hours of pickup</li>
              <li>Not engage in fraudulent chargebacks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">6. Payments and Fees</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              Pipit uses Stripe to process payments. When a transaction is completed:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Buyers pay a 5.5% platform fee on top of the item price</li>
              <li>Sellers receive the item price minus payment processing fees (~3%)</li>
              <li>Funds are held in escrow until the buyer confirms receipt</li>
              <li>Payouts are processed to sellers within 2-3 business days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">7. Meetups and Safety</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              All transactions on Pipit involve in-person meetups. For your safety:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Meet in public, well-lit locations</li>
              <li>Consider meeting at police station "safe exchange zones"</li>
              <li>Bring a friend or family member when possible</li>
              <li>Trust your instincts — cancel if something feels wrong</li>
            </ul>
            <p className="text-[#4A3F37] leading-relaxed">
              Pipit is not responsible for any incidents that occur during meetups. Use caution and
              good judgment when meeting strangers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">8. Trust and Verification</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              Pipit offers optional verification features including phone verification, email verification,
              social account linking, and ID verification. These features are designed to build trust
              but do not guarantee the identity or reliability of any user.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">9. Prohibited Conduct</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>Harass, threaten, or abuse other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Circumvent payment through off-platform transactions</li>
              <li>Create multiple accounts to evade restrictions</li>
              <li>Scrape or collect user data without permission</li>
              <li>Interfere with the proper functioning of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">10. Content and Intellectual Property</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              You retain ownership of content you post but grant Pipit a non-exclusive, royalty-free
              license to use, display, and distribute your content in connection with the Service.
            </p>
            <p className="text-[#4A3F37] leading-relaxed">
              The Pipit name, logo, and all related trademarks are property of Pipit. You may not use
              our branding without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">11. Disclaimers</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. PIPIT DOES NOT GUARANTEE:
            </p>
            <ul className="list-disc pl-6 text-[#4A3F37] space-y-2 mb-4">
              <li>The accuracy of listing information</li>
              <li>The safety or legality of items listed</li>
              <li>The identity or trustworthiness of users</li>
              <li>That transactions will be completed successfully</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">12. Limitation of Liability</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              To the maximum extent permitted by law, Pipit shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the Service,
              including but not limited to disputes between users, property damage, or personal injury.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">13. Termination</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              We may suspend or terminate your account at any time for violations of these Terms or
              for any other reason at our sole discretion. You may delete your account at any time
              through your profile settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">14. Dispute Resolution</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              Any disputes arising from these Terms or your use of the Service shall be resolved
              through binding arbitration in accordance with the rules of the American Arbitration
              Association. You agree to waive your right to a jury trial and to participate in
              class action lawsuits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">15. Changes to Terms</h2>
            <p className="text-[#4A3F37] leading-relaxed mb-4">
              We may update these Terms from time to time. We will notify you of material changes
              via email or through the Service. Continued use after changes constitutes acceptance
              of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-4">16. Contact Us</h2>
            <p className="text-[#4A3F37] leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-[#4A3F37] leading-relaxed mt-2">
              <strong>Email:</strong> legal@pipit.app<br />
              <strong>Address:</strong> Pipit Inc., Auburn, WA 98001
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
