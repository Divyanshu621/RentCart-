'use client';

import { useAppStore } from '@/store';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  const navigate = useAppStore((state) => state.navigate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('marketplace')}
            className="text-emerald-100 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Terms of Service</h1>
              <p className="text-emerald-100 text-sm md:text-base mt-1">
                Please read these terms carefully before using RentCart
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        {/* 1. Acceptance of Terms */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            By accessing, registering for, or using the RentCart platform (including our website at rentcart.in and our mobile applications), you agree to be bound by these Terms of Service, our Privacy Policy, and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our platform.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            These terms constitute a legally binding agreement between you and RentCart Technologies Pvt. Ltd. We reserve the right to update these terms at any time, and your continued use of the platform after any changes constitutes your acceptance of the revised terms. We encourage you to review these terms periodically.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you are using RentCart on behalf of a business or entity, you represent and warrant that you have the authority to bind that entity to these terms. In such cases, the terms &ldquo;you&rdquo; and &ldquo;your&rdquo; shall refer to that entity. All users, whether individuals or entities, are equally bound by the provisions of this agreement.
          </p>
        </div>

        {/* 2. User Accounts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. User Accounts</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            To use RentCart&rsquo;s full range of features, you must create a user account. You must be at least 18 years of age to create an account and use our services. By creating an account, you represent that you are of legal age to form a binding contract under Indian law and that all information you provide during registration is accurate, current, and complete.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            You are responsible for maintaining the confidentiality of your account credentials, including your password. You must not share your login details with any third party or allow anyone else to access your account. You agree to notify RentCart immediately of any unauthorised use of your account or any other breach of security you become aware of.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            RentCart reserves the right to suspend or terminate accounts that remain inactive for an extended period, that are associated with fraudulent or suspicious activity, or that violate these terms. You may only maintain one active account at a time, and creating multiple accounts may result in the suspension of all associated accounts.
          </p>
        </div>

        {/* 3. Rental Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Rental Transactions</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart facilitates rental transactions between item owners (listing their items for rent) and renters (booking items for temporary use). When a rental is initiated, a binding rental agreement is formed between the owner and the renter, with RentCart acting as the intermediary platform facilitating the transaction.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Owners are responsible for providing accurate and truthful listings, including clear descriptions, honest condition assessments, and representative photographs of the items they offer for rent. Renters are responsible for reviewing listings carefully before booking and ensuring the item meets their requirements.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            A security deposit may be required for certain rental transactions. The deposit amount is clearly displayed before booking confirmation and is held securely during the rental period. Security deposits are refunded to the renter upon satisfactory return of the item, subject to inspection for any damage beyond normal wear and tear.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            All rental terms, including duration, pricing, delivery method, and return conditions, are specified in the individual listing and confirmed during the booking process. Both parties are bound by these terms once a booking is confirmed and payment is processed through the platform.
          </p>
        </div>

        {/* 4. User Responsibilities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. User Responsibilities</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            As a RentCart user, you agree to uphold certain responsibilities to ensure a safe, fair, and trustworthy marketplace for all participants. These responsibilities apply to both owners and renters, and failure to comply may result in account restrictions or termination.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Item Care:</strong> Renters must return all rented items in the same condition as received, accounting for normal wear and tear. Any damage beyond reasonable use must be reported immediately and may result in deductions from the security deposit.</li>
            <li><strong className="text-gray-800">Honest Listings:</strong> Owners must provide accurate, complete, and truthful descriptions of their items, including any known defects, limitations, or special handling requirements. Misleading listings are a violation of these terms.</li>
            <li><strong className="text-gray-800">Timely Payments:</strong> Renters must ensure that all rental payments are made promptly through the platform. Late payments may incur additional charges and can affect your user rating and account standing.</li>
            <li><strong className="text-gray-800">Communication:</strong> Both parties must maintain respectful and timely communication throughout the rental process. All communication regarding transactions should be conducted through the platform&rsquo;s messaging system for record-keeping and dispute resolution purposes.</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            Users must not attempt to circumvent the platform by completing transactions outside of RentCart, as this undermines the safety measures and protections we provide. Off-platform transactions are not covered by our dispute resolution process or buyer protection policies.
          </p>
        </div>

        {/* 5. Prohibited Items */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Prohibited Items</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            To maintain a safe and compliant marketplace, certain categories of items are strictly prohibited from being listed or rented on RentCart. This list is non-exhaustive, and RentCart reserves the right to remove any listing that we determine violates our policies or poses a risk to the community.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li>Illegal substances, weapons, explosives, or any items prohibited by Indian law</li>
            <li>Counterfeit, pirated, or unauthorised replica goods of any kind</li>
            <li>Hazardous materials, toxic chemicals, or items requiring special licences</li>
            <li>Stolen property or items with unclear ownership provenance</li>
            <li>Items that violate intellectual property rights of third parties</li>
            <li>Any item that could be used to cause harm to persons or property</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you are unsure whether an item is permitted, please contact our support team before listing it. RentCart cooperates fully with law enforcement agencies and will take appropriate action, including reporting to authorities, when prohibited items are discovered on the platform.
          </p>
        </div>

        {/* 6. Payments & Fees */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Payments &amp; Fees</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            All rental payments on RentCart are processed securely through our integrated payment partners. Rental pricing is determined by the item owner and is clearly displayed on each listing. The total cost shown at checkout includes the rental fee for the specified duration, any applicable delivery charges, and platform fees.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart charges a platform service fee on each completed transaction to cover the costs of maintaining and improving the marketplace. This fee is calculated as a percentage of the rental amount and is disclosed transparently before you confirm any booking. The platform fee is non-refundable once a transaction is completed.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            All prices displayed on RentCart are exclusive of Goods and Services Tax (GST). Applicable GST at the prevailing rate will be added to your total at checkout in accordance with Indian tax regulations. Tax invoices are generated automatically for every transaction and can be downloaded from your account.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Security deposits are refunded within 5-7 business days after the item is returned and inspected. Refunds are processed to the original payment method. In cases where damage is identified, the cost of repair or fair depreciation will be deducted from the deposit before refund, and the renter will be notified of the assessment.
          </p>
        </div>

        {/* 7. Cancellation & Refunds */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cancellation &amp; Refunds</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            We understand that plans change, and RentCart provides a fair cancellation policy to accommodate both owners and renters. Cancellation rules vary depending on the timing of the cancellation relative to the rental start date, and are specified in each listing and at the time of booking.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Cancellation Policy:</strong> Cancellations made more than 48 hours before the rental start time receive a full refund minus the platform fee. Cancellations made between 24-48 hours before the start time receive a 50% refund. Cancellations made less than 24 hours before the start time are non-refundable. Owners may set their own cancellation policies within these guidelines.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Late Returns:</strong> Renters who return items after the agreed-upon return date will be charged an additional rental fee calculated on a pro-rata daily basis. If an item is not returned within 7 days of the due date, it may be considered lost, and the full replacement value will be charged to the renter.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Refund requests must be submitted through the platform within 7 days of the rental end date. Our support team will review each request and process approved refunds within 7-10 business days. Disputed refunds are subject to the dispute resolution process outlined in Section 8.
          </p>
        </div>

        {/* 8. Dispute Resolution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Dispute Resolution</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart provides a structured dispute resolution process to help resolve conflicts between owners and renters fairly and efficiently. If you experience an issue with a rental transaction, we encourage you to first attempt to resolve it directly with the other party through the platform&rsquo;s messaging system.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Filing a Dispute:</strong> If direct communication does not resolve the issue, you may file a formal dispute through your account within 7 days of the rental end date. You will be asked to provide a detailed description of the issue, supported by relevant evidence such as photographs, messages, or receipts.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Mediation Process:</strong> Once a dispute is filed, a RentCart mediator will review the evidence from both parties and may request additional information. The mediator will facilitate communication between the parties and propose a fair resolution based on the evidence and our policies. Most disputes are resolved within 10 business days.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Final Decisions:</strong> RentCart&rsquo;s decision in any dispute is final and binding on both parties. We strive to make fair decisions that protect the interests of both owners and renters while upholding the integrity of the marketplace. In cases where legal action is pursued, the parties agree to first attempt mediation through RentCart.
          </p>
        </div>

        {/* 9. Intellectual Property */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            All content on the RentCart platform, including but not limited to the website design, logo, graphics, icons, text, software, and the overall look and feel, is the exclusive property of RentCart Technologies Pvt. Ltd. and is protected by Indian and international intellectual property laws.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Users retain ownership of the content they post on the platform, including listing descriptions and photographs of their items. By posting content on RentCart, you grant us a non-exclusive, worldwide, royalty-free licence to use, reproduce, and display that content solely for the purpose of operating and promoting the platform.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You may not copy, modify, distribute, sell, or lease any part of our platform or included software, nor may you reverse engineer or attempt to extract the source code, unless applicable law permits it or you have our written permission. The RentCart name, logo, and all related marks are trademarks of RentCart Technologies Pvt. Ltd. and may not be used without prior written consent.
          </p>
        </div>

        {/* 10. Limitation of Liability */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart acts as an intermediary platform that connects item owners with potential renters. We do not own, control, or guarantee the quality, condition, or performance of any items listed on our platform, nor do we verify the accuracy of all listings or the suitability of items for any particular purpose.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            To the fullest extent permitted by applicable law, RentCart shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses resulting from your use of or inability to use the platform, even if we have been advised of the possibility of such damages.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Our total liability to you for any claims arising out of or relating to these terms or your use of the platform shall not exceed the amount you have paid to RentCart in the twelve (12) months preceding the event giving rise to the claim. This limitation applies regardless of the legal theory on which the claim is based.
          </p>
        </div>

        {/* 11. Termination */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Termination</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart reserves the right to suspend, disable, or terminate your access to the platform at our sole discretion, without prior notice, if we reasonably believe that you have violated any provision of these terms, engaged in fraudulent or abusive behaviour, or otherwise compromised the safety and integrity of the marketplace.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Upon termination, your right to use the platform ceases immediately. Provisions of these terms that by their nature should survive termination, including but not limited to intellectual property rights, limitation of liability, and dispute resolution clauses, shall remain in effect after termination.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You may terminate your account at any time by contacting our support team or through your account settings. Upon account termination, any pending transactions will be completed, and any outstanding obligations, including payments owed or refunds due, will be settled in accordance with these terms.
          </p>
        </div>

        {/* 12. Governing Law */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Governing Law</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            These Terms of Service shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka, India.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Both parties agree to submit to the personal and exclusive jurisdiction of the courts located in Bengaluru, Karnataka. You waive any objection to the laying of venue of any such suit, action, or proceeding, and agree not to plead or claim in any such court that any such suit, action, or proceeding brought in any such court has been brought in an inconvenient forum.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            For any disputes that are not resolved through our internal dispute resolution process, the parties agree to first attempt mediation before pursuing litigation. This requirement is intended to reduce the cost and burden of resolving disputes while ensuring fair outcomes for all parties involved.
          </p>
        </div>

        {/* 13. Changes to Terms */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Changes to These Terms</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart reserves the right to modify, amend, or update these Terms of Service at any time at our sole discretion. When we make changes, we will update the &ldquo;Last updated&rdquo; date at the top of this page and take reasonable steps to notify users of material changes.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            We will notify users of significant changes by sending an email to the address associated with your account and by displaying a prominent in-app notification. We may also provide notice through other reasonable means, including a banner on the platform&rsquo;s homepage.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your continued use of RentCart following the posting of any changes to these terms constitutes your acceptance of those changes. If you do not agree with the modified terms, you must stop using the platform and request account deletion. We recommend reviewing these terms periodically to stay informed of any updates.
          </p>
        </div>

        {/* 14. Contact Us */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">14. Contact Us</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            If you have any questions, concerns, or feedback regarding these Terms of Service, please do not hesitate to contact us. Our support team is available to assist you with any queries related to your use of the RentCart platform.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Email:</strong> support@rentcart.in</li>
            <li><strong className="text-gray-800">Legal Enquiries:</strong> legal@rentcart.in</li>
            <li><strong className="text-gray-800">Address:</strong> RentCart Technologies Pvt. Ltd., Bengaluru, Karnataka, India</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            We aim to respond to all general enquiries within 2 business days and legal enquiries within 5 business days. For the most efficient support, please include your registered email address and a detailed description of your query when contacting us.
          </p>
        </div>
      </div>
    </div>
  );
}
