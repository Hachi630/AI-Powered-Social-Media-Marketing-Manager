import { Layout, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import styles from "./PrivacyPolicy.module.css";
import meloLogo from "../img/melo-logo.jpg";

const { Footer } = Layout;
const { Title, Paragraph } = Typography;

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <Layout className={styles.layout}>
      {/* Header Bar */}
      <header className={styles.headerBar}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft} onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
            <img src={meloLogo} alt="Melo" className={styles.headerLogo} />
          </div>
          <div className={styles.headerTagline}>
            AI Social Media & Marketing Manager For Your Business
          </div>
        </div>
      </header>

      {/* Content Section */}
      <section className={styles.contentSection}>
        <div className={styles.contentWrapper}>
          <Title level={1} className={styles.pageTitle}>
            Privacy Policy
          </Title>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.1 Who we are
            </Title>
            <Paragraph className={styles.paragraph}>
              Melo is an AI-powered social media and marketing management platform built by a student team at the
              University of Auckland as part of the CS778 Consulting Challenge course. This product is currently a 
              prototype developed for educational and research purposes only. Melo helps businesses and individuals 
              create, manage, schedule, and optimize their social media content and marketing strategies through 
              AI-powered content generation, multi-platform social media integration, and intelligent calendar management.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              As a prototype, Melo is not intended for commercial use or production deployment. All data collected 
              is used solely for the purpose of providing the service, conducting research, and fulfilling course 
              requirements. The development team is committed to protecting user privacy and handling personal data 
              responsibly in accordance with applicable privacy laws and university policies.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.2 What data we collect
            </Title>
            <Paragraph className={styles.paragraph}>
              Depending on how you use Melo, we may collect the following categories of personal and non-personal data:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Account & authentication information</strong> – including your email address (required for account creation), 
                password (encrypted and stored securely), name or nickname, phone number (optional), birthday, gender, 
                address, and profile avatar. If you choose to sign in with Google OAuth, we collect your Google ID and 
                associated profile information (name, email, profile picture) provided by Google.
              </li>
              <li>
                <strong>Brand & company profile data</strong> – including brand name, company description, industry, 
                tone of voice preferences, custom tone descriptions, knowledge base products, target audience information, 
                brand logos, product types, product images, marketing goals (meloGoals), and publishing platform preferences. 
                You can manage up to 10 separate company profiles per account, each with independent brand information.
              </li>
              <li>
                <strong>Conversation & chat data</strong> – including all messages you send in AI chat conversations, 
                AI-generated responses, conversation titles, message timestamps, uploaded images and files within conversations, 
                conversation organization (project folders), and message editing history. This data is stored to maintain 
                conversation continuity and improve your experience.
              </li>
              <li>
                <strong>Calendar & content data</strong> – including scheduled social media posts, content text, images, 
                videos, publication dates and times, platform selections (LinkedIn, Twitter/X, Facebook, Instagram), 
                post status (draft, scheduled, published), campaign associations, and content variants for different platforms.
              </li>
              <li>
                <strong>Social media connection data</strong> – when you connect your social media accounts, we securely 
                store OAuth access tokens and refresh tokens for LinkedIn, Twitter/X, Facebook, and Instagram. This includes 
                user IDs, usernames, account types, page IDs (for Facebook/Instagram), token expiration dates, and profile 
                information retrieved from these platforms. We do not store your social media passwords.
              </li>
              <li>
                <strong>File uploads & media</strong> – including images, videos, and documents (PDF, DOCX) you upload to 
                the platform. Images and videos may be stored in cloud storage (AWS S3) or local file systems. Document 
                content is extracted and processed for AI analysis. File metadata (names, sizes, types, upload timestamps) 
                is also collected.
              </li>
              <li>
                <strong>AI-generated content</strong> – including text content, images, and content plans generated by 
                AI services. This includes prompts you provide, generated responses, image generation requests and results, 
                and content plan suggestions.
              </li>
              <li>
                <strong>Messaging & communication data</strong> – if you use our messaging features, we collect contact 
                information (names, phone numbers), SMS/MMS message content, WhatsApp messages, message delivery status, 
                and communication timestamps.
              </li>
              <li>
                <strong>Analytics & usage data</strong> – including page views, feature usage, interaction patterns, 
                time spent on different sections, click events, error logs, performance metrics, best posting time 
                predictions based on your content performance, and aggregated engagement statistics from connected social 
                media accounts.
              </li>
              <li>
                <strong>Technical & device data</strong> – including browser type and version, device information 
                (operating system, screen resolution), IP address (used for approximate location and security), user agent 
                strings, cookies and local storage data (for authentication tokens, theme preferences, UI state), and 
                network information.
              </li>
              <li>
                <strong>Feedback & support data</strong> – including bug reports, feature requests, ratings, comments, 
                support tickets, and any other communications you send to us.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              We collect this data through various means: directly from you when you register, create content, or interact 
              with features; automatically through your use of the service (logs, analytics); and from third-party services 
              when you connect social media accounts or use OAuth authentication.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.3 How we use your data
            </Title>
            <Paragraph className={styles.paragraph}>
              We use the data described above for the following purposes:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Service provision</strong> – to provide, operate, and maintain Melo's core features including 
                AI-powered content generation, social media management, calendar scheduling, content planning, campaign 
                management, messaging services, and analytics. Your brand profile data is used to personalize AI responses 
                and content suggestions. Your conversation history enables context-aware AI interactions.
              </li>
              <li>
                <strong>Social media integration</strong> – to connect and manage your social media accounts, publish 
                content on your behalf to LinkedIn, Twitter/X, Facebook, and Instagram, retrieve engagement metrics, 
                and manage OAuth authentication flows. Your OAuth tokens are used solely for these purposes and are 
                stored securely.
              </li>
              <li>
                <strong>Content generation & AI services</strong> – to generate text content, images, and content plans 
                using AI models. Your prompts, brand information, and conversation context are sent to third-party AI 
                providers (Google Gemini) to generate personalized content. Generated content is stored in your account 
                for future reference.
              </li>
              <li>
                <strong>Automated scheduling & publishing</strong> – to automatically publish scheduled content to 
                your connected social media accounts at specified times. Our scheduler service runs periodically to check 
                for scheduled posts and publishes them using your stored OAuth tokens.
              </li>
              <li>
                <strong>Analytics & insights</strong> – to analyze your content performance, predict optimal posting 
                times, generate engagement statistics, and provide recommendations for improving your social media strategy. 
                This includes aggregating data from your connected social media accounts.
              </li>
              <li>
                <strong>Service improvement</strong> – to improve our AI models, prompts, user interface, and overall 
                user experience. We analyze anonymized usage patterns, common workflows, error logs, and user feedback 
                to identify areas for enhancement. This analysis is done on aggregated, anonymized data where possible.
              </li>
              <li>
                <strong>Security & abuse prevention</strong> – to ensure platform security, detect and prevent abuse, 
                authenticate users, protect against unauthorized access, debug technical issues, and maintain system 
                integrity. We monitor for suspicious activities and use IP addresses and device information for security 
                purposes.
              </li>
              <li>
                <strong>Communication</strong> – to communicate with you about service updates, feature changes, 
                security notices, support requests, bug fixes, and important account-related information. We may also 
                respond to your feedback and feature requests.
              </li>
              <li>
                <strong>Research & education</strong> – as this is an educational prototype, anonymized and aggregated 
                data may be used for academic research, course projects, and learning purposes. Personal identifiers are 
                removed before any research use.
              </li>
              <li>
                <strong>Legal compliance</strong> – to comply with applicable laws, regulations, university policies, 
                and legal obligations. This may include responding to legal requests, protecting rights and safety, and 
                enforcing our terms of service.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              We do not use your personal data for advertising, marketing to third parties, or any commercial purposes 
              beyond providing the Melo service. We do not sell, rent, or trade your personal information to any third 
              parties.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.4 Third-party AI and service providers
            </Title>
            <Paragraph className={styles.paragraph}>
              To power Melo's functionality, we integrate with several third-party services that process your data on our 
              behalf. These services are essential for providing core features and operate under their own privacy and 
              security policies:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Google Gemini API</strong> – We use Google's Gemini AI models for content generation, text 
                completion, image generation, and content planning. When you use AI features, your prompts, brand context, 
                conversation history, and uploaded content may be sent to Google's servers for processing. Google processes 
                this data according to their privacy policy and terms of service. We do not share your social media 
                credentials or OAuth tokens with Google.
              </li>
              <li>
                <strong>Google OAuth</strong> – If you choose to sign in with Google, we use Google's OAuth 2.0 service 
                for authentication. Google provides us with your basic profile information (name, email, profile picture) 
                and a unique Google ID. This authentication is handled according to Google's privacy policy.
              </li>
              <li>
                <strong>Social Media Platforms</strong> – When you connect your accounts, we interact with LinkedIn, 
                Twitter/X, Facebook, and Instagram APIs to publish content, retrieve engagement metrics, and manage your 
                social media presence. These platforms process your data according to their respective privacy policies. 
                We only access data and perform actions that you explicitly authorize through OAuth.
              </li>
              <li>
                <strong>AWS S3 (Amazon Web Services)</strong> – We use AWS S3 cloud storage to store uploaded images, 
                videos, and media files. Your files are stored securely in AWS data centers. AWS processes this data 
                according to their privacy policy and security standards.
              </li>
              <li>
                <strong>MongoDB Atlas</strong> – We use MongoDB Atlas, a cloud database service, to store your account 
                information, conversations, calendar items, and other application data. MongoDB processes this data 
                according to their privacy policy and implements industry-standard security measures.
              </li>
              <li>
                <strong>Twilio</strong> – If you use our messaging features (SMS, MMS, WhatsApp), we use Twilio's services 
                to send messages. Twilio processes message content, recipient phone numbers, and delivery status according 
                to their privacy policy.
              </li>
              <li>
                <strong>Hosting Services</strong> – Our application is hosted on cloud platforms (AWS Amplify for frontend, 
                Render/Vercel for backend). These services may have access to server logs, error reports, and system 
                metrics for operational purposes.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              All third-party services are selected based on their security standards, privacy practices, and reliability. 
              We ensure that data sharing is limited to what is necessary for service provision. These providers are 
              contractually obligated to protect your data and use it only for the purposes we specify.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              We do <strong>not</strong> sell your personal information to any third parties. We do not share your data 
              with third parties for their own marketing or advertising purposes. Third-party services are used solely to 
              operate and improve this prototype.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              When you disconnect a social media account, we delete the associated OAuth tokens from our database. However, 
              content that was already published to social media platforms remains on those platforms and is subject to 
              their respective privacy policies.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.5 Data retention & security
            </Title>
            <Paragraph className={styles.paragraph}>
              <strong>Data Retention:</strong> We retain your personal data for as long as necessary to provide the 
              Melo service, fulfill the purposes outlined in this policy, or as required by law or university policies. 
              Specifically:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Account data</strong> – Retained while your account is active. If you delete your account, we 
                will delete or anonymize your personal data within 30 days, except where we are required to retain it 
                for legal, regulatory, or academic purposes.
              </li>
              <li>
                <strong>Conversation history</strong> – Retained until you delete individual conversations or your account. 
                You can delete conversations at any time through the interface.
              </li>
              <li>
                <strong>Calendar items & campaigns</strong> – Retained until you delete them or your account is deleted. 
                Published content on social media platforms remains on those platforms per their retention policies.
              </li>
              <li>
                <strong>OAuth tokens</strong> – Retained while your social media accounts are connected. Deleted immediately 
                upon disconnection.
              </li>
              <li>
                <strong>Uploaded files</strong> – Retained until you delete them or your account is deleted. Files stored 
                in cloud storage are permanently deleted when removed.
              </li>
              <li>
                <strong>Analytics data</strong> – Aggregated and anonymized analytics data may be retained longer for 
                research and course project purposes, but will not contain personally identifiable information.
              </li>
              <li>
                <strong>Logs & technical data</strong> – Server logs and technical data are typically retained for 30-90 
                days for debugging and security purposes, then automatically deleted.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              <strong>Data Security:</strong> We implement reasonable technical and organizational measures to protect your 
              data from unauthorized access, alteration, disclosure, or destruction:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Encryption</strong> – Passwords are hashed using industry-standard algorithms. Data in transit 
                is encrypted using HTTPS/TLS. Sensitive data at rest may be encrypted using encryption provided by our 
                cloud service providers.
              </li>
              <li>
                <strong>Access controls</strong> – We use authentication (JWT tokens) and authorization mechanisms to 
                ensure only authorized users can access their own data. Administrative access is restricted to the 
                development team and is logged.
              </li>
              <li>
                <strong>Secure storage</strong> – Data is stored in secure cloud databases (MongoDB Atlas) and file 
                storage (AWS S3) with built-in security features, regular backups, and access monitoring.
              </li>
              <li>
                <strong>OAuth token security</strong> – Social media OAuth tokens are stored securely in encrypted 
                database fields and are never exposed in client-side code or API responses.
              </li>
              <li>
                <strong>Regular updates</strong> – We keep our systems, dependencies, and security measures up to date 
                to address known vulnerabilities.
              </li>
              <li>
                <strong>Monitoring & incident response</strong> – We monitor for security threats and have procedures 
                in place to respond to potential data breaches or security incidents.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive 
              to protect your data, we cannot guarantee absolute security. You are responsible for maintaining the 
              confidentiality of your account credentials and for all activities that occur under your account.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              In the event of a data breach that may affect your personal information, we will notify affected users and 
              relevant authorities as required by applicable laws and university policies.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.6 Your rights and choices
            </Title>
            <Paragraph className={styles.paragraph}>
              You have certain rights regarding your personal data. Because Melo is a prototype, we handle many requests 
              manually, but we are committed to respecting your privacy rights:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Access</strong> – You can request access to the personal data we hold about you. You can view 
                much of your data directly through the Melo interface (profile information, conversations, calendar items). 
                For additional data or data export, please contact us.
              </li>
              <li>
                <strong>Correction</strong> – You can update most of your personal information directly through your 
                account settings (profile, brand information, preferences). If you need to correct data that cannot be 
                edited in the interface, please contact us.
              </li>
              <li>
                <strong>Deletion</strong> – You can delete individual conversations, calendar items, campaigns, and uploaded 
                files through the interface. You can disconnect social media accounts, which will delete associated OAuth 
                tokens. To delete your entire account and all associated data, please contact us. Note that content already 
                published to social media platforms cannot be deleted through Melo.
              </li>
              <li>
                <strong>Data portability</strong> – You can request a copy of your data in a machine-readable format. 
                We will provide this within a reasonable timeframe.
              </li>
              <li>
                <strong>Opt-out of data use</strong> – You can request that we stop using your data for service improvement 
                or research purposes. However, some data use is necessary for core service functionality.
              </li>
              <li>
                <strong>Cookie preferences</strong> – You can control cookies through your browser settings. However, 
                disabling certain cookies may affect service functionality (e.g., authentication).
              </li>
              <li>
                <strong>Social media connections</strong> – You can connect or disconnect social media accounts at any 
                time through the Social Dashboard. Disconnecting will revoke our access and delete stored tokens.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              To exercise these rights, please contact us using the contact information provided in section 1.9. We will 
              respond to your request within a reasonable timeframe, typically within 30 days. We may need to verify your 
              identity before processing certain requests.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              If you are located in the European Economic Area (EEA), United Kingdom, or other jurisdictions with 
              comprehensive data protection laws, you may have additional rights under applicable regulations (such as 
              GDPR). We will honor these rights to the extent applicable to our prototype service.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.7 Children's privacy
            </Title>
            <Paragraph className={styles.paragraph}>
              Melo is not intended for children under 13 years of age. We do not knowingly collect personal information 
              from children under 13. If you are under 18 years of age, you should only use Melo with the permission and 
              supervision of a parent, guardian, or teacher.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              If we become aware that we have collected personal information from a child under 13 without verifiable 
              parental consent, we will take steps to delete that information as soon as possible. If you are a parent 
              or guardian and believe your child has provided us with personal information, please contact us immediately 
              so we can delete the information.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              Parents and guardians should monitor their children's use of online services and help them understand the 
              importance of protecting their personal information. We encourage parents to review this Privacy Policy and 
              discuss it with their children.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.8 International data transfers
            </Title>
            <Paragraph className={styles.paragraph}>
              Melo is operated from New Zealand, but we use third-party services that may store and process your data in 
              various locations around the world, including the United States, European Union, and other countries. When 
              you use Melo, your data may be transferred to and processed in these countries.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              These transfers are necessary for providing the service, as our cloud providers (AWS, MongoDB Atlas, etc.) 
              operate globally. We ensure that appropriate safeguards are in place, including:
            </Paragraph>
            <ul className={styles.list}>
              <li>Using reputable service providers with strong privacy and security standards</li>
              <li>Relying on standard contractual clauses and other legal mechanisms where applicable</li>
              <li>Ensuring providers comply with applicable data protection laws</li>
            </ul>
            <Paragraph className={styles.paragraph}>
              By using Melo, you consent to the transfer of your data to these countries. If you have concerns about 
              international data transfers, please contact us before using the service.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.9 Contact us
            </Title>
            <Paragraph className={styles.paragraph}>
              If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your personal 
              data, please contact us:
            </Paragraph>
            <ul className={styles.list}>
              <li>
                <strong>Email:</strong> You can reach us through the contact form on our website or by emailing the 
                development team (contact information available on the Contact Us page).
              </li>
              <li>
                <strong>University Affiliation:</strong> This project is part of the CS778 Consulting Challenge course 
                at the University of Auckland. For academic inquiries, you may contact the course coordinator.
              </li>
            </ul>
            <Paragraph className={styles.paragraph}>
              We will make reasonable efforts to respond to your inquiries in a timely manner. However, as this is a 
              student project, response times may vary depending on academic schedules.
            </Paragraph>
          </div>

          <div className={styles.section}>
            <Title level={2} className={styles.sectionTitle}>
              1.10 Changes to this policy
            </Title>
            <Paragraph className={styles.paragraph}>
              We may update this Privacy Policy from time to time to reflect changes in our practices, service features, 
              legal requirements, or for other operational, legal, or regulatory reasons. When we make material changes, 
              we will:
            </Paragraph>
            <ul className={styles.list}>
              <li>Update the "last updated" date at the top of this policy</li>
              <li>Notify you through the service interface or via email (if you have provided one)</li>
              <li>Highlight significant changes in a summary or changelog</li>
            </ul>
            <Paragraph className={styles.paragraph}>
              Your continued use of Melo after changes become effective constitutes your acceptance of the updated Privacy 
              Policy. If you do not agree with the changes, you should stop using the service and may request deletion of 
              your account.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and 
              protect your information. The most current version will always be available on this page.
            </Paragraph>
            <Paragraph className={styles.paragraph}>
              <strong>Last updated:</strong> January 2025
            </Paragraph>
          </div>

          <div className={styles.backLink} onClick={() => navigate("/home")}>
            ← Back to Home
          </div>
        </div>
      </section>

      <Footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Paragraph className={styles.footerText}>
            © 2025 Melo. All rights reserved.
          </Paragraph>
        </div>
      </Footer>
    </Layout>
  );
}

