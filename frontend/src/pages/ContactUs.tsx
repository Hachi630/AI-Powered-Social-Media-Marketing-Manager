import { Layout, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import styles from "./ContactUs.module.css";
import meloLogo from "../img/melo-logo.jpg";
import lulinYangImg from "../img/Lulin Yang.png";
import kikiXingImg from "../img/Kiki Xing.png";
import tazwarHabibImg from "../img/Tazwar Habib.png";
import weijingZhangImg from "../img/Weijing Zhang.png";
import xingyuanZhouImg from "../img/Xingyuan Zhou.png";

const { Footer } = Layout;
const { Title, Paragraph } = Typography;

const TEAM_MEMBERS = [
  { id: 1, avatar: xingyuanZhouImg, name: "Xingyuan Zhou", role: "Full-stack Developer" },
  { id: 2, avatar: lulinYangImg, name: "Lulin Yang", role: "Backend Developer" },
  { id: 3, avatar: tazwarHabibImg, name: "Tazwar Habib", role: "Backend Developer" },
  { id: 4, avatar: kikiXingImg, name: "Kiki Xing", role: "Frontend Developer" },
  { id: 5, avatar: weijingZhangImg, name: "Weijing Zhang", role: "Frontend Developer" },
];

export default function ContactUs() {
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
            Our Team
          </Title>

          <div className={styles.teamRow}>
            {TEAM_MEMBERS.map((member) => (
              <div className={styles.teamMemberWrapper} key={member.id}>
                <div className={styles.teamMemberCard}>
                  <div className={styles.teamMemberAvatar}>
                    <img src={member.avatar} alt={member.name} />
                  </div>
                  <Title level={4} className={styles.teamMemberName}>
                    {member.name}
                  </Title>
                  <Paragraph className={styles.teamMemberRole}>
                    {member.role}
                  </Paragraph>
                </div>
              </div>
            ))}
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
