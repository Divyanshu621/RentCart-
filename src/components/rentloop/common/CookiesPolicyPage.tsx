'use client';

import { useAppStore } from '@/store';
import { ArrowLeft, Cookie } from 'lucide-react';

export default function CookiesPolicyPage() {
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
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Cookies Policy</h1>
              <p className="text-emerald-100 text-sm md:text-base mt-1">
                How we use cookies and similar tracking technologies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        {/* What Are Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">What Are Cookies?</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Cookies are small text files that are stored on your device (computer, tablet, or smartphone) when you visit a website or use a mobile application. They are widely used to make websites work more efficiently, provide a better browsing experience, and supply information to the website owners.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Cookies serve a variety of purposes, from remembering your login details and preferences to helping us understand how you interact with our platform. They are essential for the operation of many online services, including RentCart, and allow us to deliver a personalised and seamless rental marketplace experience.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            This Cookies Policy explains the different types of cookies we use on RentCart, why we use them, and how you can manage your cookie preferences. Alongside cookies, we may also use similar technologies such as pixel tags, local storage, and session storage, which function in a comparable manner.
          </p>
        </div>

        {/* 1. Essential Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Essential Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Essential cookies are strictly necessary for the operation of RentCart. They enable core functionality such as page navigation, secure access to authenticated areas, and communication with our servers. Without these cookies, the platform cannot function properly, and you would not be able to use our services.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Authentication:</strong> These cookies identify you when you log in and maintain your session as you navigate through the platform. They ensure that your account actions, such as booking a rental or updating your profile, are securely associated with your identity throughout your session.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Security:</strong> We use security cookies to detect and prevent malicious activities such as cross-site scripting (XSS), cross-site request forgery (CSRF), and other attacks. These cookies help protect your account and personal information from unauthorised access.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">Session Management:</strong> These cookies manage your active session on the platform, remembering your authentication state and preferences during your visit. Session cookies are temporary and are automatically deleted when you close your browser or log out of your account.
          </p>
          <p className="text-sm text-gray-500 text-xs mt-3 italic">These cookies cannot be disabled, as they are essential for the platform to function.</p>
        </div>

        {/* 2. Performance Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Performance Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Performance cookies collect anonymous information about how visitors use RentCart. These cookies help us understand which pages are visited most often, how users navigate between pages, and where users may encounter errors or difficulties. This data is aggregated and anonymised, meaning it cannot be used to identify individual users.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Analytics:</strong> We use analytics cookies to gather data about user behaviour patterns, including the most popular rental categories, search trends, and conversion rates. This information helps us make data-driven decisions to improve the platform and introduce features that our users want.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Page Load Times:</strong> These cookies monitor how quickly our pages load on different devices and network conditions. By tracking performance metrics, we can identify and resolve bottlenecks to ensure a fast and responsive experience for all users.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Crash Reports:</strong> When the application encounters an unexpected error, crash reporting cookies capture technical details about the error in a non-personal manner. This enables our engineering team to diagnose and fix issues quickly, improving platform stability for everyone.
          </p>
          <p className="text-sm text-gray-500 text-xs mt-3 italic">These cookies can be opted out through your browser settings or our cookie preference centre.</p>
        </div>

        {/* 3. Functional Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Functional Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Functional cookies allow RentCart to remember choices you have made in the past and provide enhanced, personalised features. These cookies make your experience more convenient by retaining your preferences so you do not have to set them every time you visit the platform.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Remembering Preferences:</strong> These cookies store your preferred settings such as display preferences, notification settings, and default search filters. For example, if you prefer to see rental prices in a specific format or have a default delivery location, functional cookies remember these choices across sessions.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Location Services:</strong> If you grant permission, functional cookies remember your preferred or last-used location to show you relevant rental listings in your area. This eliminates the need to repeatedly enter your location and provides a more geographically relevant browsing experience.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Language &amp; Accessibility:</strong> These cookies save your language preference and any accessibility settings you have configured, ensuring that RentCart consistently presents content in your preferred language and format every time you visit.
          </p>
          <p className="text-sm text-gray-500 text-xs mt-3 italic">These cookies can be opted out through your browser settings or our cookie preference centre.</p>
        </div>

        {/* 4. Third-Party Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Third-Party Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Third-party cookies are set by external services that are integrated into RentCart to provide specific functionality. These cookies are subject to the privacy policies of their respective providers, and we encourage you to review those policies to understand how your data is handled by these third parties.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Payment Processors:</strong> Our payment processing partners (such as Razorpay) may set cookies to facilitate secure transactions, remember your payment preferences, and prevent fraudulent activity. These cookies are essential for processing rental payments and security deposits safely and are set only during the checkout process.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-800">Google Analytics:</strong> We use Google Analytics to understand how users interact with RentCart on a broader scale. Google Analytics sets cookies to collect information about pages visited, time spent on the site, and navigation patterns. This data is processed by Google and made available to us in anonymised reports. You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            We carefully vet all third-party services integrated into RentCart and only partner with reputable providers who maintain strong data protection practices. We do not allow third-party advertising cookies on our platform.
          </p>
        </div>

        {/* 5. Managing Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Managing Your Cookie Preferences</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            You have the right to decide whether to accept or reject cookies. You can manage your cookie preferences through your browser settings, which allow you to control which types of cookies are stored on your device. Below are instructions for managing cookies in the most commonly used browsers.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Google Chrome:</strong> Go to Settings &gt; Privacy and security &gt; Third-party cookies. Here you can block all third-party cookies, allow all cookies, or customise your preferences. You can also clear existing cookies and site data from this menu.</li>
            <li><strong className="text-gray-800">Mozilla Firefox:</strong> Go to Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data. You can choose to block cookies from unvisited websites, block third-party trackers, or set custom exceptions for specific sites like RentCart.</li>
            <li><strong className="text-gray-800">Apple Safari:</strong> Go to Preferences &gt; Privacy. Safari offers intelligent tracking prevention by default. You can also choose to block all cookies, prevent cross-site tracking, or manage stored website data individually.</li>
            <li><strong className="text-gray-800">Microsoft Edge:</strong> Go to Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data. From here you can block third-party cookies, clear browsing data on exit, and manage individual site permissions.</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            Additionally, you can use the cookie consent banner displayed when you first visit RentCart to set your preferences for non-essential cookies. You can update these preferences at any time through the cookie settings accessible in the footer of our website or through your account settings.
          </p>
        </div>

        {/* 6. Impact of Disabling Cookies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Impact of Disabling Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            While you have the option to disable non-essential cookies, doing so may impact your experience on RentCart. It is important to understand the implications of disabling different categories of cookies so you can make an informed decision about your cookie preferences.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Login Required:</strong> If you disable essential cookies, you will not be able to log in to your account, make rental bookings, or access any authenticated features of the platform. The platform fundamentally depends on these cookies to identify users and maintain secure sessions.</li>
            <li><strong className="text-gray-800">Reduced Personalisation:</strong> Without functional cookies, RentCart will not remember your preferences between visits. You will need to re-enter your location, language, and display preferences each time you access the platform, resulting in a less convenient experience.</li>
            <li><strong className="text-gray-800">Limited Insights:</strong> Disabling performance cookies means we will have less data to identify and fix usability issues. While the platform will still function, our ability to optimise the user experience based on real usage data will be significantly diminished.</li>
            <li><strong className="text-gray-800">Payment Issues:</strong> Blocking third-party cookies may interfere with the functionality of our payment processing partners, potentially preventing you from completing rental transactions or receiving payment confirmations.</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            We recommend keeping at least essential and functional cookies enabled for the best experience on RentCart. If you choose to disable certain cookies and encounter issues, you can re-enable them through your browser settings or by resetting your cookie preferences on the platform.
          </p>
        </div>

        {/* 7. Updates to This Policy */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Updates to This Policy</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            RentCart may update this Cookies Policy from time to time to reflect changes in the cookies we use, changes in technology, or for other operational, legal, or regulatory reasons. We are committed to keeping you informed about how we use cookies and any changes to our practices.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            When we make material changes to this policy, we will notify you by updating the &ldquo;Last updated&rdquo; date at the top of this page and, where appropriate, by displaying a new cookie consent banner or sending a notification through the platform. We encourage you to review this policy periodically to stay informed about our cookie usage.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you have questions about a specific cookie or tracking technology used on RentCart, please do not hesitate to contact us. We are happy to provide additional details about any cookie, its purpose, its duration, and how to control it.
          </p>
        </div>

        {/* 8. Contact Us */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact Us</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            If you have any questions or concerns about this Cookies Policy or the cookies used on RentCart, please contact us. Our team is here to help you understand and manage your cookie preferences.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2 mb-3">
            <li><strong className="text-gray-800">Email:</strong> support@rentcart.in</li>
            <li><strong className="text-gray-800">Privacy Enquiries:</strong> privacy@rentcart.in</li>
            <li><strong className="text-gray-800">Address:</strong> RentCart Technologies Pvt. Ltd., Bengaluru, Karnataka, India</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            We aim to respond to all cookie-related enquiries within 5 business days. For the most efficient assistance, please include details about which cookies or features you have questions about.
          </p>
        </div>
      </div>
    </div>
  );
}
