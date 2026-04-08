'use client';

import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalInfo {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

/* ------------------------------------------------------------------ */
/*  Content Maps                                                       */
/* ------------------------------------------------------------------ */

const LEGAL_CONTENT: Record<string, LegalInfo> = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'March 10, 2026',
    sections: [
      {
        heading: '01 — Information We Collect',
        body: [
          'NychIQ ("we," "our," or "us") collects several categories of information to provide and improve the NychIQ YouTube Intelligence Platform. When you create an account, we collect your name, email address, and authentication credentials. If you subscribe to a paid plan, we also collect billing information such as your full name, payment method details, and transaction history processed through our payment partner, Paystack.',
          'To deliver our core analytics and intelligence services, we access data through the YouTube Data API v3 on your behalf. This may include publicly available channel metadata, video statistics, playlist information, comment data, and subscriber counts associated with YouTube channels you authorize us to analyze. We do not store your YouTube password or OAuth tokens beyond what is necessary to maintain an active session.',
          'We automatically collect usage analytics when you interact with the Platform, including pages visited, features used, session duration, device type, operating system, browser type, IP address (anonymised where feasible), and referring URLs. This telemetry helps us identify bugs, optimise performance, and understand how our users engage with our tools so that we can prioritise development effectively.',
        ],
      },
      {
        heading: '02 — How We Use Your Information',
        body: [
          'The information we collect is used solely to operate, maintain, and improve the NychIQ Platform. Specifically, we use your account details to authenticate your identity, personalise your dashboard experience, and communicate important service updates or security alerts. YouTube API data is processed in real time to generate channel audits, growth projections, competitive benchmarks, and other intelligence reports that you request through the Platform.',
          'Your usage analytics are aggregated and analysed to improve our algorithms, refine user interface designs, and introduce new features that address the most common workflows of our user base. In no event do we sell your personal data to advertisers or data brokers. We may use anonymised, aggregated usage trends in marketing materials or public case studies, but these will never be attributable to an individual user or channel.',
          'We may also use your contact information to send transactional emails related to your subscription (e.g., payment confirmations, renewal reminders, invoice receipts) and, where you have opted in, product newsletters or promotional content. You may unsubscribe from non-transactional communications at any time using the link provided in each email or by contacting us directly.',
        ],
      },
      {
        heading: '03 — Data Sharing & Third Parties',
        body: [
          'NychIQ integrates with a limited set of trusted third-party services to deliver its functionality. The YouTube Data API v3, operated by Google LLC, is the primary data source for all channel and video intelligence features. Data retrieved from YouTube is governed by Google\'s Terms of Service and YouTube\'s API Terms of Service, which we encourage you to review independently.',
          'We use Groq AI and HuggingFace to power natural-language processing, summarisation, and predictive analytics features within the Platform. Text or metadata you submit for analysis (such as video titles or comment threads) may be sent to these providers\' inference endpoints. Neither Groq nor HuggingFace uses your submissions to train their base models without your explicit consent, as confirmed by their respective data-usage policies.',
          'SociaVault provides social-media authentication and identity-verification services that allow you to link external accounts for seamless onboarding. Paystack processes all payment transactions and stores card or bank details in compliance with PCI-DSS Level 1 standards; NychIQ does not retain raw card numbers on its own servers. Each third party is contractually obligated to protect your data and is permitted to process it only for the specific purposes described above.',
        ],
      },
      {
        heading: '04 — Data Retention',
        body: [
          'We retain your personal data for as long as your account is active or as needed to provide the services you have requested. If you delete your account, we will remove all personally identifiable information from our primary databases within thirty (30) calendar days, except where retention is required by applicable law (e.g., financial records for tax compliance, which are kept for a minimum of five years).',
          'YouTube API data that is cached to improve response times is stored for a maximum of seven (7) days and is automatically purged thereafter. Usage analytics logs are retained for ninety (90) days in an anonymised format before being permanently deleted. Backups of our databases are encrypted at rest and rotated every thirty (30) days; deleted account data is excluded from backups at the next rotation cycle.',
          'In the event of a security incident, we may extend retention periods temporarily to assist with forensic investigation and regulatory reporting. Any such extension will be documented, and affected data will be deleted as soon as the investigation concludes and no legal obligation to retain it remains.',
        ],
      },
      {
        heading: '05 — Your Rights',
        body: [
          'In compliance with the General Data Protection Regulation (GDPR), the Nigeria Data Protection Regulation (NDPR), and other applicable privacy legislation, you have the right to access, rectify, port, and delete your personal data. You may exercise these rights at any time by logging into your account settings or by submitting a verified request to legal@nychiq.com. We will respond to all legitimate requests within fifteen (15) business days.',
          'You may request a machine-readable export of all data we hold about you, including your profile, subscription history, and any cached analytics. If you believe any of our processing activities infringe on your privacy rights, you have the right to lodge a complaint with your local supervisory authority without prejudice to any other legal remedies available to you.',
          'Where our processing relies on your consent, you may withdraw that consent at any time via your account dashboard or by contacting us. Withdrawal of consent does not affect the lawfulness of processing carried out prior to withdrawal. We will cease the relevant processing promptly and inform you of any consequences for your continued use of the Platform.',
        ],
      },
      {
        heading: '06 — Cookies',
        body: [
          'Our use of cookies and similar tracking technologies is described in detail in our Cookie Policy, which is incorporated herein by reference. In summary, we employ essential cookies to maintain session state and authenticate your interactions, preference cookies to remember your dashboard customisations, and analytics cookies powered by Umami to understand aggregate usage patterns.',
          'You can manage your cookie preferences at any time through your browser settings or the cookie consent banner displayed on your first visit. Disabling essential cookies may impair the functionality of the Platform, and we cannot guarantee full service availability if these cookies are blocked.',
        ],
      },
      {
        heading: '07 — Children\'s Privacy',
        body: [
          'The NychIQ Platform is not intended for use by individuals under the age of thirteen (13), nor do we knowingly collect personal information from children. If you are a parent or guardian and become aware that a child has provided us with personal data, please contact us immediately at legal@nychiq.com so that we may take prompt steps to delete such information from our systems.',
          'YouTube\'s own Terms of Service require users to be at least 13 years old to hold an account. Because our Platform relies on YouTube API data tied to authenticated channels, we have a reasonable expectation that our users meet this age threshold. Nevertheless, we conduct periodic reviews of our user base and may request age verification if we have grounds to suspect underage usage.',
        ],
      },
      {
        heading: '08 — Changes to This Policy',
        body: [
          'We reserve the right to update this Privacy Policy at any time to reflect changes in our practices, technology, or applicable regulations. When material changes are made, we will notify you by email at least fifteen (15) days before the revised policy takes effect, and we will update the "Last updated" date at the top of this page.',
          'Your continued use of the Platform after the effective date of any revision constitutes your acceptance of the updated terms. If you disagree with any changes, you must stop using the Platform and request account deletion before the revised policy becomes effective. We encourage you to review this page periodically to stay informed about how we protect your information.',
        ],
      },
      {
        heading: '09 — Contact',
        body: [
          'If you have any questions, concerns, or requests relating to this Privacy Policy or our data practices in general, please contact our Data Protection Officer or legal team at the following address:',
          'NychIQ Legal — legal@nychiq.com',
          'We aim to acknowledge all inquiries within two (2) business days and to provide a substantive response within fifteen (15) business days, or sooner where required by applicable law.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of Service',
    lastUpdated: 'March 10, 2026',
    sections: [
      {
        heading: '01 — Acceptance of Terms',
        body: [
          'By accessing or using the NychIQ YouTube Intelligence Platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, our Cookie Policy, and our Refund Policy, all of which are incorporated herein by reference. If you do not agree to any part of these Terms, you must discontinue use of the Platform immediately and refrain from creating an account.',
          'These Terms constitute a legally binding agreement between you ("User," "you," or "your") and NychIQ ("Company," "we," "us," or "our"). They apply to all visitors, registered users, and subscribers of the Platform, regardless of whether you access it via web browser, mobile application, or any other interface we may provide in the future.',
          'We reserve the right to modify these Terms at any time. Material changes will be communicated via email or an in-platform notice at least fifteen (15) days before they take effect. Continued use following any modification signifies your acceptance of the revised Terms. If you do not accept the changes, your sole remedy is to cease using the Platform and terminate your account.',
        ],
      },
      {
        heading: '02 — Description of Service',
        body: [
          'NychIQ provides a web-based analytics and intelligence platform designed to help content creators, marketers, agencies, and researchers extract actionable insights from YouTube channels and videos. The Platform leverages the YouTube Data API v3, artificial intelligence models (including Groq AI and HuggingFace), and proprietary algorithms to deliver channel audits, growth projections, audience demographics, competitive benchmarks, and content performance reports.',
          'Specific features may include, but are not limited to: real-time subscriber and view tracking, video SEO analysis, comment sentiment analysis, thumbnail A/B scoring, revenue estimation, upload scheduling recommendations, and custom report generation. The availability of any feature is subject to your subscription tier and the continued operation of our third-party data providers.',
          'We strive to maintain high uptime and data accuracy; however, the Platform is provided on an "as is" and "as available" basis. We do not guarantee that the Platform will be uninterrupted, error-free, or free of harmful components. Temporary interruptions may occur due to scheduled maintenance, third-party API outages, or circumstances beyond our reasonable control.',
        ],
      },
      {
        heading: '03 — Account Registration',
        body: [
          'To access the full functionality of the Platform, you must register an account by providing a valid email address and creating a secure password. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. If you suspect unauthorised access, you must notify us immediately at legal@nychiq.com.',
          'You agree to provide accurate, current, and complete information during registration and to update such information promptly if it changes. We reserve the right to suspend or terminate accounts where the registrant has provided false or misleading information. Accounts registered through automated scripts or bots will be removed without prior notice.',
          'Each individual or entity may maintain only one active account unless expressly authorised by NychIQ in writing. We reserve the right to merge, transfer, or close duplicate accounts at our discretion, and any subscription credits or tokens associated with duplicate accounts may be forfeited.',
        ],
      },
      {
        heading: '04 — Subscription Plans & Tokens',
        body: [
          'NychIQ offers multiple subscription plans (e.g., Starter, Pro, Enterprise) with varying feature sets, usage limits, and pricing. Plan details, current pricing, and applicable taxes are displayed on our pricing page and may be updated from time to time. By selecting a plan and completing payment, you enter into a recurring subscription agreement that auto-renews at the end of each billing cycle unless you cancel before the renewal date.',
          'Certain features and advanced AI analyses consume "tokens," a usage-based credit system within the Platform. Each subscription tier includes a monthly token allocation. If you exhaust your allocation before the end of a billing cycle, you may purchase additional token packs at the rates published on the Platform. Unused tokens expire at the end of each billing cycle and do not carry over, except where explicitly stated for Enterprise plans.',
          'All fees are quoted in United States Dollars (USD) or Nigerian Naira (NGN), depending on your selected billing currency. Payment is processed through Paystack, and you authorise us to charge the payment method on file at the start of each billing period. Failed payments may result in immediate suspension of access until valid payment is provided.',
        ],
      },
      {
        heading: '05 — Acceptable Use',
        body: [
          'You agree to use the Platform only for lawful purposes and in compliance with all applicable local, national, and international laws and regulations. You shall not use the Platform to scrape, harvest, or bulk-extract YouTube data beyond what our API integrations provide; to stalk, harass, or intimidate any YouTube creator or viewer; to circumvent YouTube\'s rate limits, terms of service, or security measures; or to generate misleading, defamatory, or infringing content.',
          'Prohibited activities include, but are not limited to: attempting to reverse-engineer, decompile, or disassemble any part of the Platform; introducing malware, viruses, or other harmful code; using automated scripts to artificially inflate usage metrics; reselling access to the Platform without our written consent; and sharing your account credentials with third parties.',
          'We reserve the right to investigate and take appropriate action against any user who, in our sole discretion, violates these Acceptable Use provisions. Such action may include issuing a warning, throttling or suspending access, withholding tokens, or permanently terminating the offending account without refund. We may also report illegal activities to relevant law enforcement authorities.',
        ],
      },
      {
        heading: '06 — Intellectual Property',
        body: [
          'All content, features, functionality, software, and design elements of the Platform—including but not limited to text, graphics, logos, icons, code, and the overall "look and feel"—are the exclusive property of NychIQ or its licensors and are protected by copyright, trademark, patent, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit any portion of the Platform without our prior written consent.',
          'The NychIQ name, logo, and all related marks are trademarks of NychIQ. No license or right is granted to you to use any trademark displayed on the Platform other than as expressly permitted in these Terms. All goodwill arising from your use of our trademarks inures solely to our benefit.',
          'YouTube channel names, video titles, thumbnails, and other metadata retrieved through the Platform remain the intellectual property of their respective owners. NychIQ does not claim ownership over any YouTube content analysed or displayed within the Platform. Your use of such content must comply with YouTube\'s Terms of Service and applicable fair-use or fair-dealing provisions.',
        ],
      },
      {
        heading: '07 — User-Generated Content',
        body: [
          'Certain features of the Platform may allow you to submit, upload, or input content, such as custom report configurations, competitor channel lists, or notes. By submitting User-Generated Content ("UGC"), you grant NychIQ a worldwide, non-exclusive, royalty-free, transferable licence to use, reproduce, modify, and distribute such content solely for the purpose of operating and improving the Platform.',
          'You represent and warrant that you own or control all rights in your UGC and that your UGC does not infringe upon any third party\'s intellectual property, privacy, or other rights. You acknowledge that NychIQ is not obligated to monitor, review, or editorialise your UGC, but we reserve the right to remove or refuse to display any UGC that we determine, in our sole discretion, violates these Terms or is otherwise objectionable.',
          'To the extent permitted by applicable law, you agree to indemnify, defend, and hold harmless NychIQ, its officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, and expenses (including reasonable attorneys\' fees) arising from or related to your UGC or your breach of these Terms.',
        ],
      },
      {
        heading: '08 — Disclaimers',
        body: [
          'The Platform and all content, services, and features are provided on an "as is" and "as available" basis without warranties of any kind, whether express, implied, or statutory, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, and accuracy. NychIQ does not warrant that the Platform will meet your specific requirements or that the results obtained from using the Platform will be reliable or error-free.',
          'Analytics, projections, and insights generated by the Platform are derived from publicly available YouTube data and AI models. While we make reasonable efforts to ensure accuracy, we make no guarantee that any metric, forecast, or recommendation is definitive. You should treat all outputs as informational tools to supplement—not replace—your own professional judgement. We are not liable for any decisions made based on Platform outputs.',
          'Any reference to specific third-party products, services, or platforms does not imply endorsement. Links or integrations with external services are provided for convenience only, and NychIQ is not responsible for the content, privacy practices, or availability of any third-party website or service.',
        ],
      },
      {
        heading: '09 — Limitation of Liability',
        body: [
          'To the maximum extent permitted by applicable law, NychIQ and its officers, directors, employees, agents, licensors, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill, arising out of or in connection with your use of or inability to use the Platform, regardless of the legal theory under which such liability is asserted.',
          'Our total aggregate liability for any claim arising under or related to these Terms shall not exceed the amount you have paid to NychIQ in the twelve (12) months immediately preceding the event giving rise to the claim. This limitation applies whether the alleged liability is based on contract, tort (including negligence), strict liability, or any other legal theory, even if we have been advised of the possibility of such damages.',
          'Some jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, so the above limitation may not apply to you. In such jurisdictions, our liability shall be limited to the fullest extent permitted by applicable law.',
        ],
      },
      {
        heading: '10 — Termination',
        body: [
          'You may terminate your account at any time by navigating to the account settings page and selecting "Delete Account," or by contacting us at legal@nychiq.com. Upon termination, your right to access the Platform ceases immediately. We will retain certain information as required by law (see our Privacy Policy) and permanently delete all other personal data within thirty (30) calendar days.',
          'NychIQ reserves the right to suspend or terminate your account, with or without notice, if you breach any provision of these Terms, engage in prohibited activities, or if we are required to do so by law or at the request of a competent authority. Upon termination for cause, no refund will be issued for any remaining subscription period or unused tokens.',
          'All provisions of these Terms that by their nature should survive termination—including intellectual property rights, disclaimers, limitation of liability, indemnification, and governing law—shall remain in full force and effect after your account is terminated or these Terms are otherwise ended.',
        ],
      },
      {
        heading: '11 — Governing Law',
        body: [
          'These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict-of-law principles. Any dispute arising out of or in connection with these Terms or the Platform shall be subject to the exclusive jurisdiction of the competent courts in Lagos State, Nigeria.',
          'Notwithstanding the foregoing, if you are a resident of a jurisdiction that mandates local adjudication or consumer-protection remedies, those mandatory provisions shall apply to the extent required by law. We encourage you to attempt to resolve any dispute informally by contacting us at legal@nychiq.com before initiating formal legal proceedings.',
        ],
      },
      {
        heading: '12 — Changes to These Terms',
        body: [
          'We reserve the right to amend these Terms at any time. When we make material changes, we will provide at least fifteen (15) days\' advance notice by emailing the address associated with your account and/or by displaying a prominent notice within the Platform. Your continued use after the effective date constitutes acceptance of the amended Terms.',
          'If you do not agree with a revised version of these Terms, you must stop using the Platform and request account deletion before the revision takes effect. Archived versions of previous Terms will be made available upon request so that you can compare changes over time.',
        ],
      },
      {
        heading: '13 — Contact',
        body: [
          'For questions, clarifications, or notices regarding these Terms of Service, please contact us at:',
          'NychIQ Legal — legal@nychiq.com',
          'We will endeavour to respond to all inquiries within five (5) business days. For urgent legal matters, please include "URGENT" in your email subject line.',
        ],
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    lastUpdated: 'March 10, 2026',
    sections: [
      {
        heading: '01 — 7-Day Money-Back Guarantee',
        body: [
          'NychIQ stands behind the quality of its YouTube Intelligence Platform. If you are a new subscriber and are not completely satisfied with your initial purchase, you may request a full refund within seven (7) calendar days of your first payment ("Money-Back Period"). This guarantee applies to the first transaction on a given account and covers the entire subscription fee paid during that transaction, regardless of plan tier.',
          'To qualify for the Money-Back Guarantee, your account must not have been previously associated with a paid subscription, and you must not have consumed more than fifty percent (50%) of the token allocation included with your purchased plan. Refund requests submitted after the seven-day window, or from accounts that have previously received a refund, will be evaluated under the Exceptions section below rather than under this guarantee.',
          'Refunds issued under this guarantee will be processed within five (5) to ten (10) business days and credited to the original payment method used during checkout. Please note that your bank or payment provider may impose additional processing time before the funds appear in your account.',
        ],
      },
      {
        heading: '02 — Subscription Renewals',
        body: [
          'After the initial Money-Back Period has expired, all subsequent subscription renewal charges are non-refundable. By maintaining an active subscription, you acknowledge and agree that auto-renewal charges will be processed at the beginning of each billing cycle and that these charges are final once the billing cycle commences.',
          'If you wish to avoid being charged for an upcoming renewal, you must cancel your subscription before the renewal date. Cancellation can be performed at any time through your account settings under "Subscription & Billing." Upon cancellation, you will retain access to the Platform and any remaining tokens until the end of the current prepaid period, after which your account will automatically revert to the free tier.',
          'In exceptional circumstances—such as a verified technical error on our part that materially prevented you from using the Platform for the majority of a billing cycle—we may, at our sole discretion, issue a prorated credit or refund. Such exceptions are evaluated on a case-by-case basis and are not guaranteed.',
        ],
      },
      {
        heading: '03 — Cancellation Process',
        body: [
          'You may cancel your subscription at any time by navigating to Settings → Subscription & Billing within your NychIQ dashboard and clicking "Cancel Subscription." A confirmation prompt will display the exact date your access will end. No additional charges will be incurred after cancellation, and your data will be preserved for sixty (60) days in case you decide to resubscribe.',
          'Alternatively, you may request cancellation by emailing billing@nychiq.com with the subject line "Subscription Cancellation — [Your Email]." Please include your registered email address and, for verification purposes, the last four digits of the payment method on file. We will process your request within two (2) business days and send a confirmation email once cancellation is complete.',
          'Please be aware that uninstalling the application, deleting browser cookies, or simply discontinuing use of the Platform does not constitute cancellation. Your subscription will continue to renew and charges will continue to be applied until you complete the formal cancellation steps described above.',
        ],
      },
      {
        heading: '04 — Token Purchases',
        body: [
          'Standalone token packs and add-on token bundles are non-refundable once any portion of the purchased tokens has been consumed or allocated to your account. Because tokens represent a usage-based digital good that is delivered and made available immediately upon purchase, we are unable to reclaim or redistribute tokens once they have been credited to your account.',
          'If you purchase a token pack in error and have not yet used any of the tokens, you may request a reversal within twenty-four (24) hours of purchase by contacting billing@nychiq.com. We will review the request and, if the tokens remain unused, we will either reverse the transaction or issue a credit to your account for equivalent value.',
          'Free promotional tokens, tokens earned through referral programmes, and tokens included as part of a subscription plan have no monetary value and are not eligible for refund, exchange, or transfer under any circumstances.',
        ],
      },
      {
        heading: '05 — Exceptions',
        body: [
          'While our standard policies are designed to be fair and transparent, we recognise that unique situations may arise. We will consider refund requests outside the Money-Back Period on a case-by-case basis in the following limited circumstances: (a) a substantiated technical issue on NychIQ\'s end that prevented access for three (3) or more consecutive days during a billing cycle; (b) duplicate charges resulting from a confirmed payment processing error; or (c) charges incurred after you submitted a timely cancellation request that was not processed due to our error.',
          'Requests based on dissatisfaction with data accuracy, feature availability, or subjective preferences will generally not be approved after the Money-Back Period. We encourage you to thoroughly evaluate the Platform during the trial or Money-Back Period to ensure it meets your needs before committing to a longer subscription.',
          'All exception requests must be submitted in writing to billing@nychiq.com within thirty (30) days of the charge in question. Requests submitted after this window will not be considered. We will acknowledge receipt within two (2) business days and provide a final decision within ten (10) business days.',
        ],
      },
      {
        heading: '06 — How to Request a Refund',
        body: [
          'To initiate a refund request, please send an email to billing@nychiq.com with the following information: your registered email address, the transaction or invoice number (found on your payment confirmation email), the date of the charge, the amount, and a brief explanation of the reason for your request. Providing complete information will help us process your request more quickly.',
          'Once your request is received, our billing team will review it and may reach out for additional details if necessary. Approved refunds are typically processed within five (5) to ten (10) business days and returned to the original payment method. Refunds issued to credit or debit cards may take an additional three (3) to five (5) business days to appear on your statement, depending on your bank\'s policies.',
          'If your refund request is denied, we will provide a written explanation detailing the reason. You may appeal a denial within fourteen (14) calendar days by responding to the denial email with supplementary information or context. All appeal decisions are final.',
        ],
      },
      {
        heading: '07 — Contact',
        body: [
          'For any billing-related questions, refund inquiries, or subscription concerns, please contact our billing support team at:',
          'NychIQ Billing — billing@nychiq.com',
          'We are committed to resolving all billing matters promptly and fairly. Our team is available to assist you Monday through Friday, 9:00 AM to 6:00 PM West Africa Time (WAT).',
        ],
      },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    lastUpdated: 'March 10, 2026',
    sections: [
      {
        heading: '01 — What Are Cookies',
        body: [
          'Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, to remember your preferences, and to provide information to the owners of the site. Cookies allow websites to recognise your device and remember information about your visit, such as your preferred language and other settings.',
          'The NychIQ Platform uses cookies and similar tracking technologies—including local storage and session storage—to deliver a smooth, personalised experience. This Cookie Policy explains the different types of cookies we use, why we use them, and how you can manage your preferences. By continuing to use the Platform, you consent to the placement of cookies as described in this policy, unless you have adjusted your browser settings to block them.',
          'Cookies can be "first-party" (set by NychIQ directly) or "third-party" (set by our service providers or partners). They can also be "session" cookies (which expire when you close your browser) or "persistent" cookies (which remain on your device for a set period or until you manually delete them). The sections below detail each category we employ.',
        ],
      },
      {
        heading: '02 — Types of Cookies We Use',
        body: [
          'Essential Cookies: These cookies are strictly necessary for the operation of the Platform. They enable core functionality such as user authentication, session management, and security features (e.g., CSRF protection). Because these cookies are essential, they cannot be disabled without rendering the Platform unusable. Essential cookies do not collect personal information beyond what is needed to maintain your session and are automatically deleted when your session ends or expires.',
          'Preference Cookies: These cookies remember choices you have made within the Platform, such as your preferred dashboard layout, display language, colour theme (dark or light mode), and notification settings. Preference cookies are set by NychIQ and persist across sessions so that you do not need to reconfigure your settings each time you visit. They have a maximum lifespan of one (1) year and can be cleared at any time through your browser or our cookie management interface.',
          'Analytics Cookies: We use Umami, an open-source, privacy-friendly analytics platform, to collect anonymised usage data. Umami cookies track aggregate metrics such as page views, session duration, device types, and geographic regions, without collecting personally identifiable information. No data is shared with advertising networks, and all Umami data is processed in compliance with GDPR. These cookies help us understand how users interact with the Platform so that we can improve navigation, fix bugs, and prioritise new features.',
          'Third-Party Cookies via Paystack: When you initiate a payment or manage your subscription, cookies are set by Paystack, our payment processing partner. Paystack uses these cookies to secure your transaction, prevent fraud, and maintain your payment session. Paystack\'s own cookie and privacy policies govern the use of these cookies, which you can review on Paystack\'s website. Paystack cookies are temporary session cookies and are removed when you complete or abandon the checkout process.',
        ],
      },
      {
        heading: '03 — Managing Cookies',
        body: [
          'You have the right to decide whether to accept or reject cookies. Most web browsers allow you to control cookies through their settings menu, where you can set your browser to refuse all cookies, accept only first-party cookies, or delete cookies when you close your browser. For detailed instructions, consult the help documentation of your specific browser (e.g., Chrome, Firefox, Safari, Edge).',
          'The first time you visit the NychIQ Platform, a cookie consent banner will appear, allowing you to accept or customise your cookie preferences. You can withdraw or modify your consent at any time by clearing your cookies in your browser settings or by clicking the "Cookie Preferences" link in the Platform footer, which will re-display the consent banner.',
          'Please be aware that disabling certain cookies—particularly essential cookies—may impair the functionality of the Platform. For example, you may be unable to log in, persist dashboard settings, or complete payments. We recommend accepting all cookies for the best experience, but you are free to restrict them to the categories you are comfortable with.',
        ],
      },
      {
        heading: '04 — Third-Party Cookies',
        body: [
          'In addition to our own cookies, the Platform may set or receive cookies from third-party services that we rely on to deliver specific features. These include YouTube Data API integrations (for fetching channel data), Groq AI and HuggingFace (for processing AI-driven analyses), Umami (for analytics), and Paystack (for payment processing). Each of these providers operates under its own privacy and cookie policies, and we encourage you to review them.',
          'We do not permit third-party advertising cookies on the Platform. NychIQ does not participate in cross-site tracking, behavioural advertising networks, or retargeting campaigns. The third-party cookies we do allow are limited to the functional purposes described above and are not used to build advertising profiles or share your data with marketers.',
          'If you are concerned about third-party cookies, you may opt out of Umami tracking by enabling the "Do Not Track" setting in your browser, which Umami respects. Paystack cookies are essential to completing transactions and cannot be independently opted out of without forgoing the ability to make payments on the Platform.',
        ],
      },
      {
        heading: '05 — Changes to This Cookie Policy',
        body: [
          'We may update this Cookie Policy from time to time to reflect changes in the cookies we use, changes in technology, or regulatory requirements. When we make material changes, we will notify you by updating the "Last updated" date at the top of this page and, where appropriate, by re-displaying the cookie consent banner on your next visit to the Platform.',
          'We recommend that you review this policy periodically to stay informed about how we use cookies and related technologies. If you have questions about this Cookie Policy or our cookie practices, please contact us at legal@nychiq.com, and we will be happy to assist you.',
        ],
      },
      {
        heading: '06 — Contact',
        body: [
          'For questions or concerns about our use of cookies, please contact us at:',
          'NychIQ Legal — legal@nychiq.com',
          'We aim to respond to all cookie-related inquiries within five (5) business days. If you believe that a cookie on our Platform is causing a technical issue or violating your privacy expectations, please include your browser type, version, and a description of the issue in your message so that we can investigate promptly.',
        ],
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Fallback for unknown types                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_INFO: LegalInfo = {
  title: 'Legal',
  lastUpdated: '',
  sections: [
    {
      heading: 'Information',
      body: [
        'The legal page you requested could not be found. Please select a valid page from the navigation.',
        'For questions, contact legal@nychiq.com.',
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface LegalPageProps {
  type: string;
}

export function LegalPage({ type }: LegalPageProps) {
  const { setPage } = useNychIQStore();
  const info = LEGAL_CONTENT[type] || DEFAULT_INFO;

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1E1E1E]">
        <button
          onClick={() => setPage('welcome')}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5A623]" />
          <span className="text-sm font-black tracking-[1.5px] uppercase">NY<span className="text-[#F5A623]">CHIQ</span></span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-[#E8E8E8] mb-2">{info.title}</h1>
        {info.lastUpdated && (
          <p className="text-sm text-[#888888] mb-8">Last updated: {info.lastUpdated}</p>
        )}

        <div className="space-y-8">
          {info.sections.map((section, idx) => (
            <section key={idx} className="nychiq-card p-6">
              <h2 className="text-lg font-semibold text-[#F5A623] mb-4">{section.heading}</h2>
              <div className="space-y-3 text-sm text-[#888888] leading-relaxed">
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} dangerouslySetInnerHTML={{ __html: paragraph }} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E] px-6 py-6 mt-auto">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <span>&copy; {new Date().getFullYear()} NychIQ</span>
          <button onClick={() => setPage('privacy')} className="hover:text-text-secondary transition-colors">Privacy</button>
          <button onClick={() => setPage('terms')} className="hover:text-text-secondary transition-colors">Terms</button>
          <button onClick={() => setPage('contact')} className="hover:text-text-secondary transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );
}
