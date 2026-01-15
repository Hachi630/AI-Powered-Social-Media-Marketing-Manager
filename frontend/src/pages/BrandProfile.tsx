import {
  CloseOutlined,
  PlusOutlined,
  UploadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileUnknownOutlined,
  DeleteOutlined,
  ShopOutlined,
  EditOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Input,
  Layout,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Upload,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import { MELO_LOGO } from "../constants/assets";
import styles from "./BrandProfile.module.css";
import { User, authService } from "../services/authService";
import { uploadService } from "../services/uploadService";
import { getImageUrl } from "../utils/imageUtils";

const { Content } = Layout;

const toneButtons = [
  { key: "calm", label: "Calm", color: "#AE906E" },
  { key: "warm", label: "Warm", color: "#B98E6B" },
  { key: "mindful", label: "Mindful", color: "#908066" },
];

const initialKnowledgeProducts = ["Lavender Candle", "Succulent Pot"];

const industryOptions = [
  { value: "home-decor", label: "Home Decor" },
  { value: "wellness", label: "Wellness" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "beauty", label: "Beauty" },
  { value: "fashion", label: "Fashion" },
  { value: "food", label: "Food & Restaurant" },
];

const initialAudience = ["Yoga lovers", "Interior design enthusiast"];

// Company data structure for multi-company support
interface CompanyData {
  id: string;
  name: string;
  brandName: string;
  industry: string;
  toneOfVoice: string;
  customTone: string;
  knowledgeProducts: string[];
  targetAudience: string[];
  companyDescription: string;
  brandLogoUrl?: string; // Optional URL for brand logo
  productTypes?: string[]; // Optional listing of product types
  productImages?: string[]; // Optional array of product image URLs
  meloGoals?: string[]; // Optional array of goals
}

// Default company template
const createDefaultCompany = (name: string): CompanyData => ({
  id: `company_${Date.now()}`,
  name,
  brandName: "",
  industry: "",
  toneOfVoice: "calm",
  customTone: "",
  knowledgeProducts: [],
  targetAudience: [],
  companyDescription: "",
  brandLogoUrl: "",
  productTypes: [],
  productImages: [],
  meloGoals: [],
});

interface BrandProfileProps {
  isLoggedIn: boolean;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  user?: User | null;
}

export default function BrandProfile({
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  user: propUser,
}: BrandProfileProps) {
  const [user, setUser] = useState<User | null>(propUser || null);
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [selectedTone, setSelectedTone] = useState("calm");
  const [customTone, setCustomTone] = useState("");
  const [showCustomToneInput, setShowCustomToneInput] = useState(false);
  const [audienceTags, setAudienceTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [knowledgeProducts, setKnowledgeProducts] = useState<string[]>([]);
  const [showAddProductInput, setShowAddProductInput] = useState(false);
  const [newProduct, setNewProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyDescription, setCompanyDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [meloGoals, setMeloGoals] = useState<string[]>([]);
  const [newProductType, setNewProductType] = useState("");
  const [newMeloGoal, setNewMeloGoal] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Multi-company state management
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState("");

  // Load companies from localStorage on mount
  useEffect(() => {
    const savedCompanies = localStorage.getItem("melo_companies");
    const savedSelectedId = localStorage.getItem("melo_selected_company");

    if (savedCompanies) {
      const parsed = JSON.parse(savedCompanies) as CompanyData[];
      if (parsed.length > 0) {
        setCompanies(parsed);

        // Restore selected company or select first one
        if (savedSelectedId && parsed.find((c) => c.id === savedSelectedId)) {
          setSelectedCompanyId(savedSelectedId);
          loadCompanyData(parsed.find((c) => c.id === savedSelectedId)!);
        } else {
          setSelectedCompanyId(parsed[0].id);
          loadCompanyData(parsed[0]);
        }
        return;
      }
    }

    // Create default company if none exists
    const defaultCompany = createDefaultCompany("My Company");
    setCompanies([defaultCompany]);
    setSelectedCompanyId(defaultCompany.id);
    localStorage.setItem("melo_companies", JSON.stringify([defaultCompany]));
    localStorage.setItem("melo_selected_company", defaultCompany.id);
  }, []);

  // Load user data on mount and when propUser changes
  useEffect(() => {
    const loadUser = async () => {
      if (isLoggedIn) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Only load from user if no companies exist (first time)
          if (companies.length === 0) {
            setBrandName(currentUser.brandName || "");
            setIndustry(currentUser.industry || "");
            const toneOfVoice = currentUser.toneOfVoice || "calm";
            // Check if tone is a custom tone (not in predefined list)
            const isCustomTone = !toneButtons.some(
              (tone) => tone.key === toneOfVoice
            );
            if (isCustomTone && toneOfVoice) {
              setSelectedTone("custom");
              setCustomTone(toneOfVoice);
              setShowCustomToneInput(true);
            } else {
              setSelectedTone(toneOfVoice);
              setCustomTone("");
              setShowCustomToneInput(false);
            }
            setKnowledgeProducts(currentUser.knowledgeProducts || []);
            setAudienceTags(currentUser.targetAudience || []);
          }
        }
      }
    };
    loadUser();
  }, [isLoggedIn, propUser]);

  // Load company data into form
  const loadCompanyData = (company: CompanyData) => {
    setBrandName(company.brandName);
    setIndustry(company.industry);
    const toneOfVoice = company.toneOfVoice || "calm";
    const isCustomTone = !toneButtons.some((tone) => tone.key === toneOfVoice);
    if (isCustomTone && toneOfVoice && toneOfVoice !== "calm") {
      setSelectedTone("custom");
      setCustomTone(company.customTone || toneOfVoice);
      setShowCustomToneInput(true);
    } else {
      setSelectedTone(toneOfVoice);
      setCustomTone(company.customTone || "");
      setShowCustomToneInput(toneOfVoice === "custom");
    }
    setKnowledgeProducts(company.knowledgeProducts || []);
    setAudienceTags(company.targetAudience || []);
    setCompanyDescription(company.companyDescription || "");
    setBrandLogoUrl(company.brandLogoUrl || "");
    setProductTypes(company.productTypes || []);
    setProductImages(company.productImages || []);
    setMeloGoals(company.meloGoals || []);
  };

  // Show brand profile tip on page load (once per day)
  useEffect(() => {
    if (isLoggedIn) {
      const today = new Date().toDateString();
      const lastTipDate = localStorage.getItem("elo-brand-tip-date");

      // Show tip if not shown today
      if (lastTipDate !== today) {
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("elo-show-tip", {
              detail: {
                message:
                  "The more complete your profile, the better I can provide personalized recommendations",
                type: "tip",
                duration: 6000,
              },
            })
          );
          localStorage.setItem("elo-brand-tip-date", today);
        }, 1500); // Show after 1.5 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn]);

  // Unified data loading - single useEffect to prevent race conditions
  useEffect(() => {
    // Skip if already loaded to prevent duplicate loads
    if (isDataLoaded) {
      console.log("[BrandProfile] Data already loaded, skipping");
      return;
    }

    const loadAllData = async () => {
      console.log("[BrandProfile] Starting data load, isLoggedIn:", isLoggedIn);

      if (isLoggedIn) {
        try {
          const currentUser = await authService.getCurrentUser();
          console.log("[BrandProfile] Got user from API:", currentUser?.email);

          if (currentUser) {
            setUser(currentUser);

            // Check if user has companies in database
            if (currentUser.companies && currentUser.companies.length > 0) {
              console.log(
                "[BrandProfile] Loading companies from database:",
                currentUser.companies.length
              );

              // Load from database
              setCompanies(currentUser.companies);
              // Sync to localStorage
              localStorage.setItem(
                "melo_companies",
                JSON.stringify(currentUser.companies)
              );

              const savedSelectedId = localStorage.getItem(
                "melo_selected_company"
              );
              let companyToLoad: CompanyData;

              if (
                savedSelectedId &&
                currentUser.companies.find((c) => c.id === savedSelectedId)
              ) {
                setSelectedCompanyId(savedSelectedId);
                companyToLoad = currentUser.companies.find(
                  (c) => c.id === savedSelectedId
                )!;
              } else {
                setSelectedCompanyId(currentUser.companies[0].id);
                localStorage.setItem(
                  "melo_selected_company",
                  currentUser.companies[0].id
                );
                companyToLoad = currentUser.companies[0];
              }

              // Load company data into form
              loadCompanyData(companyToLoad);
              setIsDataLoaded(true);
              return;
            }
          }
        } catch (error) {
          console.error(
            "[BrandProfile] Error loading data from database:",
            error
          );
        }
      }

      // Fallback to localStorage
      console.log("[BrandProfile] Falling back to localStorage");
      const savedCompanies = localStorage.getItem("melo_companies");
      const savedSelectedId = localStorage.getItem("melo_selected_company");

      if (savedCompanies) {
        try {
          const parsed = JSON.parse(savedCompanies) as CompanyData[];
          if (parsed.length > 0) {
            console.log(
              "[BrandProfile] Loaded companies from localStorage:",
              parsed.length
            );
            setCompanies(parsed);

            let companyToLoad: CompanyData;
            if (
              savedSelectedId &&
              parsed.find((c) => c.id === savedSelectedId)
            ) {
              setSelectedCompanyId(savedSelectedId);
              companyToLoad = parsed.find((c) => c.id === savedSelectedId)!;
            } else {
              setSelectedCompanyId(parsed[0].id);
              companyToLoad = parsed[0];
            }

            loadCompanyData(companyToLoad);
            setIsDataLoaded(true);
            return;
          }
        } catch (e) {
          console.error(
            "[BrandProfile] Error parsing localStorage companies:",
            e
          );
        }
      }

      // Create default company if none exists
      console.log("[BrandProfile] Creating default company");
      const defaultCompany = createDefaultCompany("My Company");
      setCompanies([defaultCompany]);
      setSelectedCompanyId(defaultCompany.id);
      localStorage.setItem("melo_companies", JSON.stringify([defaultCompany]));
      localStorage.setItem("melo_selected_company", defaultCompany.id);
      loadCompanyData(defaultCompany);
      setIsDataLoaded(true);
    };

    loadAllData();
  }, [isLoggedIn, isDataLoaded]);

  // Update user when propUser changes (for header updates)
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);
  // Save current form data to selected company
  const saveCurrentToCompany = () => {
    if (!selectedCompanyId) return;

    const toneOfVoice =
      selectedTone === "custom" && customTone.trim()
        ? customTone.trim()
        : selectedTone;

    const updatedCompanies = companies.map((company) => {
      if (company.id === selectedCompanyId) {
        return {
          ...company,
          // Update company name to brand name if brand name is set
          name: brandName.trim() || company.name,
          brandName,
          industry,
          toneOfVoice,
          customTone,
          knowledgeProducts,
          targetAudience: audienceTags,
          companyDescription,
          brandLogoUrl,
          productTypes,
          productImages,
          meloGoals,
        };
      }
      return company;
    });

    setCompanies(updatedCompanies);
    localStorage.setItem("melo_companies", JSON.stringify(updatedCompanies));
  };

  // Switch to a different company
  const handleSelectCompany = (companyId: string) => {
    // Save current data first
    if (selectedCompanyId) {
      saveCurrentToCompany();
    }

    setSelectedCompanyId(companyId);
    localStorage.setItem("melo_selected_company", companyId);

    const company = companies.find((c) => c.id === companyId);
    if (company) {
      loadCompanyData(company);
    }
  };

  // Add a new company - directly creates a new blank company
  const handleAddCompany = () => {
    // Save current data first
    if (selectedCompanyId) {
      saveCurrentToCompany();
    }

    // Generate a unique default name
    const existingNames = companies.map((c) => c.name);
    let newName = "New Company";
    let counter = 1;
    while (existingNames.includes(newName)) {
      newName = `New Company ${counter}`;
      counter++;
    }

    const newCompany = createDefaultCompany(newName);
    const updatedCompanies = [...companies, newCompany];

    setCompanies(updatedCompanies);
    localStorage.setItem("melo_companies", JSON.stringify(updatedCompanies));

    // Select the new company and load blank form
    setSelectedCompanyId(newCompany.id);
    localStorage.setItem("melo_selected_company", newCompany.id);
    loadCompanyData(newCompany);

    message.success("New company created! Fill in the details below.");
  };

  // Delete a company
  const handleDeleteCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    const updatedCompanies = companies.filter((c) => c.id !== companyId);
    setCompanies(updatedCompanies);
    localStorage.setItem("melo_companies", JSON.stringify(updatedCompanies));

    // If deleted company was selected, select another
    if (selectedCompanyId === companyId) {
      if (updatedCompanies.length > 0) {
        setSelectedCompanyId(updatedCompanies[0].id);
        localStorage.setItem("melo_selected_company", updatedCompanies[0].id);
        loadCompanyData(updatedCompanies[0]);
      } else {
        setSelectedCompanyId(null);
        localStorage.removeItem("melo_selected_company");
      }
    }

    message.success(`Company "${company.name}" deleted`);
  };

  // Edit company name
  const handleEditCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setEditingCompanyId(companyId);
      setEditingCompanyName(company.name);
    }
  };

  // Save edited company name
  const handleSaveCompanyName = () => {
    if (!editingCompanyId || !editingCompanyName.trim()) return;

    const updatedCompanies = companies.map((company) => {
      if (company.id === editingCompanyId) {
        return { ...company, name: editingCompanyName.trim() };
      }
      return company;
    });

    setCompanies(updatedCompanies);
    localStorage.setItem("melo_companies", JSON.stringify(updatedCompanies));

    setEditingCompanyId(null);
    setEditingCompanyName("");
  };

  const addAudienceTag = () => {
    if (!keyword.trim()) {
      return;
    }
    if (!audienceTags.includes(keyword.trim())) {
      setAudienceTags([...audienceTags, keyword.trim()]);
    }
    setKeyword("");
  };

  const removeAudienceTag = (tag: string) => {
    setAudienceTags(audienceTags.filter((item) => item !== tag));
  };

  const handleAddProduct = () => {
    if (newProduct.trim() && !knowledgeProducts.includes(newProduct.trim())) {
      setKnowledgeProducts([...knowledgeProducts, newProduct.trim()]);
      setNewProduct("");
      setShowAddProductInput(false);
    }
  };

  const handleRemoveProduct = (productToRemove: string) => {
    setKnowledgeProducts(
      knowledgeProducts.filter((product) => product !== productToRemove)
    );
  };

  const handleToneSelect = (toneKey: string) => {
    if (toneKey === "custom") {
      setShowCustomToneInput(true);
      setSelectedTone("custom");
    } else {
      setShowCustomToneInput(false);
      setSelectedTone(toneKey);
      setCustomTone("");
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || ""))
      return <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />;
    if (["xlsx", "xls", "csv"].includes(ext || ""))
      return <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />;
    if (["doc", "docx", "txt"].includes(ext || ""))
      return <FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />;
    return <FileUnknownOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />;
  };

  // Handle file upload
  const handleFileUpload: UploadProps["onChange"] = async ({ fileList }) => {
    // Update file list immediately for UI feedback
    setUploadedFiles(fileList);

    // Find newly added files (files that are not yet uploaded)
    const newFiles = fileList.filter(
      (file) => file.status === "uploading" || file.status === undefined
    );

    // Upload each new file
    for (const file of newFiles) {
      if (file.originFileObj) {
        try {
          // Set file status to uploading
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.uid === file.uid ? { ...f, status: "uploading" } : f
            )
          );

          // Upload file to server
          const response = await uploadService.uploadFile(file.originFileObj);

          if (response.success && response.fileUrl) {
            // Update file status to success
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.uid === file.uid
                  ? {
                      ...f,
                      status: "done",
                      url: response.fileUrl,
                      response: response,
                    }
                  : f
              )
            );
            message.success(`${file.name} uploaded successfully`);
          } else {
            // Update file status to error
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.uid === file.uid
                  ? { ...f, status: "error", response: response }
                  : f
              )
            );
            message.error(
              `Failed to upload ${file.name}: ${
                response.message || "Unknown error"
              }`
            );
          }
        } catch (error: any) {
          // Update file status to error
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.uid === file.uid
                ? { ...f, status: "error", response: { error: error.message } }
                : f
            )
          );
          message.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
    }
  };

  // Handle file removal
  const handleRemoveFile = (file: UploadFile) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.uid !== file.uid));
  };

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Use custom tone if custom is selected and has value, otherwise use selected tone
      const toneOfVoice =
        selectedTone === "custom" && customTone.trim()
          ? customTone.trim()
          : selectedTone;

      // Save to local company data first
      saveCurrentToCompany();

      // Build updated companies array directly from current form values
      // This ensures we use the latest form data, not stale state
      const updatedCompanies = companies.map((company) => {
        if (company.id === selectedCompanyId) {
          return {
            ...company,
            name: brandName.trim() || company.name,
            brandName: brandName.trim(),
            industry: industry.trim(),
            toneOfVoice: toneOfVoice,
            customTone: customTone.trim(),
            knowledgeProducts: [...knowledgeProducts],
            targetAudience: [...audienceTags],
            companyDescription: companyDescription.trim(),
            brandLogoUrl: brandLogoUrl.trim(),
            productTypes: [...productTypes],
            productImages: [...productImages],
            meloGoals: [...meloGoals],
          };
        }
        return company;
      });

      // Update companies array in state before saving
      setCompanies(updatedCompanies);
      
      // Save to localStorage
      localStorage.setItem("melo_companies", JSON.stringify(updatedCompanies));

      const response = await authService.updateProfile({
        brandName,
        industry,
        toneOfVoice,
        knowledgeProducts,
        targetAudience: audienceTags,
        companyDescription,
        companies: updatedCompanies, // CRITICAL: Send companies array with productImages
      });

      if (response.success && response.user) {
        setUser(response.user);
        onLoginSuccess(response.user);
        message.success("Profile saved successfully");
      } else {
        message.error(response.message || "Failed to save profile");
      }
    } catch (error) {
      message.error("An error occurred while saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className={styles.layout}>
      <Header
        isLoggedIn={isLoggedIn}
        showBrandName={false}
        logoSrc={MELO_LOGO}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Content className={styles.content}>
        <Typography.Title level={1} className={styles.pageTitle}>
          Brand Profile (
          {[user?.name || "User", user?.brandName].filter(Boolean).join(" - ")})
        </Typography.Title>

        {/* Company Selector */}
        <Card className={`${styles.card} ${styles.companySelector}`}>
          <div className={styles.companySelectorContent}>
            <div className={styles.companySelectorHeader}>
              <ShopOutlined className={styles.companySelectorIcon} />
              <Typography.Text strong className={styles.companySelectorTitle}>
                Select Company
              </Typography.Text>
            </div>

            <div className={styles.companyList}>
              {companies.map((company) => (
                <div
                  key={company.id}
                  className={`${styles.companyItem} ${selectedCompanyId === company.id ? styles.companyItemActive : ""}`}
                  onClick={() => handleSelectCompany(company.id)}
                >
                  {editingCompanyId === company.id ? (
                    <Input
                      size="small"
                      value={editingCompanyName}
                      onChange={(e) => setEditingCompanyName(e.target.value)}
                      onPressEnter={handleSaveCompanyName}
                      onClick={(e) => e.stopPropagation()}
                      className={styles.companyNameInput}
                      autoFocus
                    />
                  ) : (
                    <span className={styles.companyName}>{company.name}</span>
                  )}

                  <div
                    className={styles.companyActions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {editingCompanyId === company.id ? (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={handleSaveCompanyName}
                        className={styles.companyActionBtn}
                      />
                    ) : (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditCompanyName(company.id)}
                        className={styles.companyActionBtn}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCompany(company.id)}
                      className={styles.companyDeleteBtn}
                      disabled={companies.length <= 1}
                    />
                  </div>
                </div>
              ))}

              {/* Add new company button - directly creates blank company */}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddCompany}
                className={styles.addCompanyBtn}
              >
                Add New Company
              </Button>
            </div>
          </div>
        </Card>

        {/* Row 1: Basic Info + Company Description + Tone of Voice */}
        <Row gutter={[24, 24]} align="stretch" className={styles.cardRow}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Card
              title="Basic Info"
              className={`${styles.card} ${styles.basicInfo}`}
            >
              <Space
                direction="vertical"
                size="large"
                className={styles.fullWidth}
              >
                <div>
                  <Typography.Text className={styles.fieldLabel}>
                    Brand Name
                  </Typography.Text>
                  <Input
                    size="large"
                    placeholder="Brand Name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>
                <div>
                  <Typography.Text className={styles.fieldLabel}>
                    Industry
                  </Typography.Text>
                  <Select
                    size="large"
                    value={industry}
                    onChange={(value) => setIndustry(value)}
                    options={industryOptions}
                    className={styles.fullWidth}
                    placeholder="Select industry"
                  />
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8}>
            <Card
              title="Company Description"
              className={`${styles.card} ${styles.companyDesc}`}
            >
              <Space
                direction="vertical"
                size="middle"
                className={styles.fullWidth}
              >
                <Typography.Text type="secondary">
                  Describe your company, products, services, and unique value
                  proposition
                </Typography.Text>
                <Input.TextArea
                  size="large"
                  placeholder="Tell us about your company... (e.g., mission, vision, history, products, services)"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  showCount
                  className={styles.textArea}
                />
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8} lg={8}>
            <Card
              title="Tone of Voice"
              className={`${styles.card} ${styles.toneOfVoice}`}
            >
              <Space
                direction="vertical"
                size="middle"
                className={styles.fullWidth}
              >
                <Typography.Text type="secondary">
                  How should the AI sound?
                </Typography.Text>
                <Space size="middle" wrap>
                  {toneButtons.map((tone) => (
                    <Button
                      key={tone.key}
                      size="large"
                      shape="round"
                      className={styles.toneButton}
                      type={selectedTone === tone.key ? "primary" : "default"}
                      style={
                        selectedTone === tone.key
                          ? {
                            backgroundColor: tone.color,
                            borderColor: tone.color,
                          }
                          : undefined
                      }
                      onClick={() => handleToneSelect(tone.key)}
                    >
                      {tone.label}
                    </Button>
                  ))}
                  <Button
                    size="large"
                    shape="round"
                    className={styles.toneButton}
                    type={selectedTone === "custom" ? "primary" : "default"}
                    onClick={() => handleToneSelect("custom")}
                  >
                    Custom
                  </Button>
                </Space>
                {showCustomToneInput && (
                  <div>
                    <Input
                      size="large"
                      placeholder="Enter custom tone (e.g., professional, friendly)"
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      onPressEnter={() => {
                        if (customTone.trim()) {
                          setSelectedTone("custom");
                        }
                      }}
                    />
                    <Typography.Text
                      type="secondary"
                      className={styles.helperText}
                    >
                      Describe how you want the AI to communicate
                    </Typography.Text>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Row 2: Upload Database + Target Knowledge Base + Target Audience */}
        <Row gutter={[24, 24]} align="stretch" className={styles.cardRow}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Card
              title="Upload Database"
              className={`${styles.card} ${styles.uploadDatabase}`}
            >
              <Space
                direction="vertical"
                size="middle"
                className={styles.fullWidth}
              >
                <Typography.Text type="secondary">
                  Upload annual reports, financial data, product catalogs, or
                  any business documents
                </Typography.Text>
                <Upload.Dragger
                  multiple
                  fileList={uploadedFiles}
                  onChange={handleFileUpload}
                  beforeUpload={() => false}
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.sql,.db,.sqlite,.sqlite3"
                  className={styles.uploadDragger}
                >
                  <p className={styles.uploadIcon}>
                    <UploadOutlined />
                  </p>
                  <p className={styles.uploadText}>
                    Click or drag files to upload
                  </p>
                  <p className={styles.uploadHint}>
                    Supports PDF, Excel, CSV, Word, TXT, SQL, Database files
                  </p>
                </Upload.Dragger>
                {uploadedFiles.length > 0 && (
                  <div className={styles.fileList}>
                    {uploadedFiles.map((file) => (
                      <div key={file.uid} className={styles.fileItem}>
                        <div className={styles.fileInfo}>
                          {getFileIcon(file.name)}
                          <div className={styles.fileDetails}>
                            <Typography.Text
                              ellipsis
                              className={styles.fileName}
                            >
                              {file.name}
                            </Typography.Text>
                            <Typography.Text
                              type="secondary"
                              className={styles.fileSize}
                            >
                              {file.size ? formatFileSize(file.size) : ""}
                            </Typography.Text>
                          </div>
                        </div>
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveFile(file)}
                          className={styles.deleteFileBtn}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8}>
            <Card
              title="Target Knowledge Base"
              className={`${styles.card} ${styles.knowledgeBase}`}
            >
              <Typography.Paragraph type="secondary">
                AI has learned about these products
              </Typography.Paragraph>
              <ul className={styles.list}>
                {knowledgeProducts.map((product) => (
                  <li key={product}>
                    <span className={styles.productName}>{product}</span>
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      size="small"
                      onClick={() => handleRemoveProduct(product)}
                      className={styles.removeButton}
                    />
                  </li>
                ))}
              </ul>
              {!showAddProductInput ? (
                <Button
                  icon={<PlusOutlined />}
                  type="dashed"
                  block
                  onClick={() => setShowAddProductInput(true)}
                >
                  Add New Product
                </Button>
              ) : (
                <Space direction="vertical" className={styles.fullWidth}>
                  <Input
                    placeholder="Enter new product name"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onPressEnter={handleAddProduct}
                  />
                  <Space>
                    <Button type="primary" onClick={handleAddProduct}>
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddProductInput(false);
                        setNewProduct("");
                      }}
                    >
                      Cancel
                    </Button>
                  </Space>
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8} lg={8}>
            <Card
              title="Target Audience"
              className={`${styles.card} ${styles.targetAudience}`}
            >
              <Space
                direction="vertical"
                size="large"
                className={styles.fullWidth}
              >
                <Input
                  size="large"
                  placeholder="Add Keywords"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onPressEnter={addAudienceTag}
                />
                <div className={styles.tagsContainer}>
                  {audienceTags.map((tag) => (
                    <Tag
                      key={tag}
                      color="blue"
                      closable
                      onClose={() => removeAudienceTag(tag)}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
                <Button type="primary" onClick={addAudienceTag}>
                  Add Keyword
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Row 3: Product Types, Product Images, Melo Goals */}
        <Row gutter={[24, 24]} align="stretch" className={styles.cardRow}>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Card
              title="Product Types"
              className={`${styles.card} ${styles.productTypes}`}
            >
              <Space
                direction="vertical"
                size="large"
                className={styles.fullWidth}
              >
                <Input
                  size="large"
                  placeholder="Add product type"
                  value={newProductType}
                  onChange={(event) => setNewProductType(event.target.value)}
                  onPressEnter={() => {
                    if (
                      newProductType.trim() &&
                      !productTypes.includes(newProductType.trim())
                    ) {
                      setProductTypes([...productTypes, newProductType.trim()]);
                      setNewProductType("");
                    }
                  }}
                />
                <div className={styles.tagsContainer}>
                  {productTypes.map((type) => (
                    <Tag
                      key={type}
                      color="green"
                      closable
                      onClose={() =>
                        setProductTypes(productTypes.filter((t) => t !== type))
                      }
                    >
                      {type}
                    </Tag>
                  ))}
                </div>
                <Button
                  type="primary"
                  onClick={() => {
                    if (
                      newProductType.trim() &&
                      !productTypes.includes(newProductType.trim())
                    ) {
                      setProductTypes([...productTypes, newProductType.trim()]);
                      setNewProductType("");
                    }
                  }}
                >
                  Add Product Type
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8} lg={8}>
            <Card
              title="Product Images"
              className={`${styles.card} ${styles.productImages}`}
            >
              <Space
                direction="vertical"
                size="middle"
                className={styles.fullWidth}
              >
                <Upload
                  onChange={(info) => {
                    const file =
                      info.file.originFileObj ||
                      (info.file as any).originFileObj ||
                      info.file;
                    if (file && file instanceof File) {
                      const isImage = file.type.startsWith("image/");
                      if (!isImage) {
                        message.error("Only image files are allowed");
                        return;
                      }
                      const isLt10M = file.size / 1024 / 1024 < 10;
                      if (!isLt10M) {
                        message.error("Image size must be less than 10MB");
                        return;
                      }
                      uploadService.uploadImage(file).then((response) => {
                        if (response.success && response.imageUrl) {
                          setProductImages([
                            ...productImages,
                            response.imageUrl!,
                          ]);
                          message.success("Image uploaded successfully");
                        } else {
                          message.error(
                            response.message || "Failed to upload image"
                          );
                        }
                      });
                    }
                  }}
                  showUploadList={false}
                  accept="image/*"
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />} block>
                    Upload Product Image
                  </Button>
                </Upload>
                {productImages.length > 0 && (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {productImages.map((url, index) => (
                      <div
                        key={index}
                        style={{
                          position: "relative",
                          width: "80px",
                          height: "80px",
                        }}
                      >
                        <img
                          src={getImageUrl(url)}
                          alt={`Product ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() =>
                            setProductImages(
                              productImages.filter((_, i) => i !== index)
                            )
                          }
                          style={{ position: "absolute", top: 0, right: 0 }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={8} lg={8}>
            <Card
              title="Melo Goals"
              className={`${styles.card} ${styles.meloGoals}`}
            >
              <Space
                direction="vertical"
                size="large"
                className={styles.fullWidth}
              >
                <Input
                  size="large"
                  placeholder="Add goal"
                  value={newMeloGoal}
                  onChange={(event) => setNewMeloGoal(event.target.value)}
                  onPressEnter={() => {
                    if (
                      newMeloGoal.trim() &&
                      !meloGoals.includes(newMeloGoal.trim())
                    ) {
                      setMeloGoals([...meloGoals, newMeloGoal.trim()]);
                      setNewMeloGoal("");
                    }
                  }}
                />
                <div className={styles.tagsContainer}>
                  {meloGoals.map((goal) => (
                    <Tag
                      key={goal}
                      color="purple"
                      closable
                      onClose={() =>
                        setMeloGoals(meloGoals.filter((g) => g !== goal))
                      }
                    >
                      {goal}
                    </Tag>
                  ))}
                </div>
                <Button
                  type="primary"
                  onClick={() => {
                    if (
                      newMeloGoal.trim() &&
                      !meloGoals.includes(newMeloGoal.trim())
                    ) {
                      setMeloGoals([...meloGoals, newMeloGoal.trim()]);
                      setNewMeloGoal("");
                    }
                  }}
                >
                  Add Goal
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Save Button */}
        <Row gutter={[24, 24]} className={styles.saveRow}>
          <Col span={24}>
            <div className={styles.saveButtonContainer}>
              <Button
                type="primary"
                size="large"
                onClick={handleSaveProfile}
                loading={loading}
                className={styles.saveButton}
              >
                Save Profile
              </Button>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
