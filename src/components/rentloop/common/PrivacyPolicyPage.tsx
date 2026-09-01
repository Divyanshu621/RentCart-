'use client';

import { useAppStore } from '@/store';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
              <p className="text-emerald-100 text-sm md:text-base mt-1">
                How we protect your data and respect your privacy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            At RentCart, we are committed to safeguarding your personal information and ensuring that your experience on our platform is both secure and transparent. This Privacy Policy describes how we collect, use, disclose, and protect your data when you use our rental marketplace services available at rentcart.in and through our mobile applications.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            By accessing or using RentCart, you acknowledge that you have read, understood, and agree to the practices described in this policy. If you do not agree with any part of this policy, please discontinue use of our services immediately.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            We encourage you to read this policy carefully and to check this page periodically for any updates. Your continued use of RentCart after any changes to this policy constitutes your acceptance of such changes.
          </p>
        </div>

        {/* 1. Information We Collect */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            We collect several categories of information to provide you with a seamless rental experience. This information is gathered both directly from you when you interact with our platform and automatically through our systems as you use our services.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Personal Information:</strong> When you create an account, we collect your full name, email address, phone number, profile photograph, and government-issued identification documents for verification purposes. If you choose to link a social media account, we may also collect your public profile information from those platforms.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Usage Data:</strong> We automatically collect information about how you interact with RentCart, including pages visited, search queries, rental listings viewed, time spent on each page, and the features you use most frequently. This data helps us understand user behaviour and improve our platform accordingly.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Device Information:</strong> We collect information about the device you use to access RentCart, including the device type, operating system, browser type and version, screen resolution, and unique device identifiers. This information is used to ensure compatibility and optimise your experience across different devices.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Location Information:</strong> With your explicit consent, we may collect your precise or approximate location to show you relevant rental listings in your area, facilitate pickup and delivery logistics, and provide location-based services. You can manage location permissions through your device settings at any time.
          </p>
        </div>

        {/* 2. How We Use Your Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            The personal information we collect serves several important purposes, all aimed at delivering a reliable, efficient, and enjoyable rental marketplace experience. We use your data responsibly and only for the purposes described below.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Service Delivery:</strong> Your information is essential for facilitating rental transactions between owners and renters. This includes verifying your identity, processing rental bookings, managing payments and security deposits, coordinating item pickups and returns, and providing customer support throughout the rental lifecycle.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Communication:</strong> We use your contact details to send you important notifications about your rentals, account activity, security alerts, and platform updates. With your consent, we may also send you promotional communications about new features, special offers, and personalised recommendations based on your browsing and rental history.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Platform Improvement:</strong> We analyse usage data and feedback to continuously improve our services. This includes identifying performance bottlenecks, understanding user preferences, developing new features, and optimising the overall user experience on RentCart.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Security & Fraud Prevention:</strong> We use your information to detect and prevent fraudulent activities, unauthorised access, and other security threats. This includes monitoring transactions for suspicious patterns, verifying user identities during high-risk actions, and enforcing our community guidelines.
          </p>
        </div>

        {/* 3. Information Sharing */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            We understand that your privacy is paramount. RentCart does not sell, rent, or trade your personal data to third parties for their marketing purposes. We only share your information in the specific circumstances outlined below, and we take measures to ensure that any third party receiving your data handles it with the same level of care.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">With Owners and Renters:</strong> When you participate in a rental transaction, we share relevant information with the other party to facilitate the rental. This may include your name, profile picture, verified contact information, and rental history summary. Sensitive details such as your full address or financial information are never shared directly with other users.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Payment Processors:</strong> We share transaction-related data with our trusted payment processing partners to facilitate secure rental payments and security deposit handling. These partners are contractually obligated to protect your financial information and are compliant with applicable payment industry security standards.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Legal Requirements:</strong> We may disclose your information if required by law, regulation, or legal process, or if we believe in good faith that such disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request. We will notify you of such disclosures to the extent permitted by law.
          </p>
        </div>

        {/* 4. Data Security */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart implements industry-standard security measures to protect your personal information from unauthorised access, alteration, disclosure, or destruction. We treat data security as a continuous process and regularly update our practices to address emerging threats.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Encryption:</strong> All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security) 1.3. Sensitive data at rest, including personal identification documents and payment information, is encrypted using AES-256 encryption, which is the gold standard for data protection.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Secure Servers:</strong> Our infrastructure is hosted on secure, certified data centres with robust physical and network security controls. These facilities feature multi-layered access controls, redundant power supplies, fire suppression systems, and 24/7 monitoring to ensure the highest level of data availability and protection.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Regular Audits:</strong> We conduct periodic security audits and vulnerability assessments performed by independent third-party security firms. Our engineering team also performs continuous monitoring and automated security testing to identify and address potential vulnerabilities before they can be exploited.
          </p>
        </div>

        {/* 5. Data Retention */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart retains your personal information only for as long as necessary to fulfil the purposes for which it was collected, comply with our legal obligations, resolve disputes, and enforce our agreements. We have established data retention schedules that balance our operational needs with your privacy rights.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Active Account Data:</strong> While your account is active, we retain all the information you provide to deliver our services effectively. This includes your profile information, rental history, communications, and preferences. You can review and manage most of this information through your account settings at any time.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Rental Records:</strong> In accordance with Indian tax and financial regulations, we retain detailed records of all rental transactions, including payment histories, invoices, and rental agreements, for a minimum period of seven (7) years from the date of transaction completion. This retention is legally mandated and cannot be shortened.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Account Deletion:</strong> If you request account deletion, we will remove your personal information from our active systems within 30 days, except where retention is required by law. Anonymised or aggregated data that cannot reasonably be used to identify you may be retained indefinitely for analytical and improvement purposes.
          </p>
        </div>

        {/* 6. Your Rights */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            We believe you should have meaningful control over your personal information. RentCart respects and supports the data rights granted to you under applicable privacy laws, and we make it straightforward for you to exercise these rights.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Right of Access:</strong> You have the right to request a copy of the personal data we hold about you. You can download a summary of your data directly from your account settings, or contact our support team for a comprehensive data report.</li>
            <li><strong className="text-gray-800">Right to Correction:</strong> You can update or correct your personal information at any time through your account settings. If you are unable to make changes yourself, our support team will assist you promptly upon request.</li>
            <li><strong className="text-gray-800">Right to Deletion:</strong> You may request the deletion of your personal data, subject to certain exceptions such as ongoing transactions, legal disputes, or regulatory retention requirements. Upon approval, deletion will be completed within 30 days.</li>
            <li><strong className="text-gray-800">Right to Data Portability:</strong> You can request to receive your personal data in a structured, commonly used, and machine-readable format (such as JSON or CSV), enabling you to transfer your data to another service provider if you choose.</li>
            <li><strong className="text-gray-800">Right to Object:</strong> You have the right to object to the processing of your personal data in certain circumstances, including for direct marketing purposes or when we rely on legitimate interests as the legal basis for processing.</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            To exercise any of these rights, please contact our Data Protection Officer at privacy@rentcart.in. We aim to respond to all legitimate requests within 15 working days. In some cases, we may need to verify your identity before processing your request.
          </p>
        </div>

        {/* 7. Cookies & Tracking */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies & Tracking Technologies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart uses cookies and similar tracking technologies to enhance your browsing experience, analyse platform usage, and deliver personalised content. Cookies are small text files stored on your device that help us remember your preferences and understand how you interact with our services.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            We use different categories of cookies, including essential cookies required for the platform to function, performance cookies that help us understand usage patterns, and functional cookies that remember your preferences. For a detailed explanation of each cookie category and how to manage your preferences, please refer to our dedicated Cookies Policy.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You can control cookie settings through your browser preferences at any time. Please note that disabling certain cookies may affect the functionality of our platform and limit your ability to use some features. We also use pixel tags and similar technologies in our emails to track open rates and engagement, helping us improve our communications.
          </p>
        </div>

        {/* 8. Children's Privacy */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Children&rsquo;s Privacy</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart is not intended for use by individuals under the age of 18 years. We do not knowingly collect personal information from children. If you are a parent or guardian and become aware that your child has provided us with personal data without your consent, please contact us immediately.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Upon receiving verifiable notice that we have collected data from a child under 18, we will take prompt steps to delete that information from our servers and records. If we discover that a child under 18 has an account with us, we will terminate that account and remove all associated data in accordance with applicable laws.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            We take children&rsquo;s privacy seriously and implement reasonable measures to prevent underage users from accessing our platform. During the account creation process, we require users to confirm they are at least 18 years of age, and we may request age verification in certain circumstances.
          </p>
        </div>

        {/* 9. Changes to Policy */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to This Privacy Policy</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart reserves the right to update or modify this Privacy Policy at any time to reflect changes in our practices, technologies, legal requirements, or other factors. We are committed to keeping you informed about how we protect your privacy, and we will always strive to make any changes clear and easy to understand.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            When we make material changes to this policy, we will notify you by sending an email to the address associated with your account and by displaying a prominent notice within the RentCart application. We will also update the &ldquo;Last updated&rdquo; date at the top of this page to reflect the date of the most recent revision.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information. Your continued use of RentCart after any changes to this policy constitutes your acceptance of the revised terms.
          </p>
        </div>

        {/* 10. Contact Us */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, we encourage you to reach out to us. Our dedicated privacy and support teams are here to assist you and will respond to your enquiries as promptly as possible.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Email:</strong> support@rentcart.in</li>
            <li><strong className="text-gray-800">Privacy Enquiries:</strong> privacy@rentcart.in</li>
            <li><strong className="text-gray-800">Address:</strong> RentCart Technologies Pvt. Ltd., Bengaluru, Karnataka, India</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            For urgent privacy-related concerns, please mark your email subject line as &ldquo;Privacy Urgent&rdquo; to ensure it receives priority attention. We are committed to resolving all privacy-related queries within 15 working days and will keep you informed of our progress throughout the process.
          </p>
        </div>
      </div>
    </div>
  );
}
