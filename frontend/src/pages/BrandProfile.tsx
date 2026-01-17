
import {
  CloseOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Layout,
  Modal,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useMemo, useState, useEffect } from "react";
import Header from "../components/Header";
import { MELO_LOGO } from "../constants/assets";
import styles from "./BrandProfile.module.css";
import { User, authService } from "../services/authService";
import { uploadService } from "../services/uploadService";
import { getImageUrl } from "../utils/imageUtils";
import { isDemoMode } from "../demo/demoMode";
import { demoBrandProfile } from "../demo/demoServices";

const { Content } = Layout;

const toneOptions = [
  { key: "calm", label: "Calm", color: "#AE906E" },
  { key: "warm", label: "Warm", color: "#B98E6B" },
  { key: "mindful", label: "Mindful", color: "#908066" },
];

const industryOptions = [
  { value: "home-decor", label: "Home Decor" },
  { value: "wellness", label: "Wellness" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "beauty", label: "Beauty" },
  { value: "fashion", label: "Fashion" },
  { value: "food", label: "Food & Restaurant" },
];

const audienceSuggestions = [
  "Women",
  "Men",
  "Students",
  "Parents",
  "Professionals",
  "Wellness seekers",
  "Home decorators",
  "Travelers",
];

const productTypeSuggestions = [
  "Clothing",
  "Hats",
  "Shoes",
  "Accessories",
  "Home decor",
  "Beauty",
  "Wellness",
];

const goalSuggestions = [
  "Expand Market",
  "Acquire New Users",
  "Improve Product Quality",
  "Enhance Value",
  "Increase Retention",
  "Boost Awareness",
];

interface CompanyData {
  id: string;
  name: string;
  brandName: string;
  industry: string;
  toneOfVoice: string;
  customTone: string;
  toneAdjectives: string[];
  toneDos: string[];
  toneDonts: string[];
  knowledgeProducts: string[];
  targetAudience: string[];
  companyDescription: string;
  brandLogoUrl?: string;
  productTypes: string[];
  productImages: string[];
  meloGoals: string[];
}

const createDefaultCompany = (name: string): CompanyData => ({
  id: `company_${Date.now()}`,
  name,
  brandName: "",
  industry: "",
  toneOfVoice: "calm",
  customTone: "",
  toneAdjectives: [],
  toneDos: [],
  toneDonts: [],
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

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  tagColor?: string;
  label?: string;
  hint?: string;
  onDirty?: () => void;
}

function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
  tagColor,
  label,
  hint,
  onDirty,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onChange([...value, trimmed]);
    onDirty?.();
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
    onDirty?.();
  };

  return (
    <div className={styles.tagInput}>
      {label ? (
        <div className={styles.tagInputHeader}>
          <Typography.Text className={styles.fieldLabel}>{label}</Typography.Text>
          {hint ? (
            <Typography.Text type="secondary" className={styles.helperText}>
              {hint}
            </Typography.Text>
          ) : null}
        </div>
      ) : null}
      <div className={styles.tagInputControl}>
        <Input
          value={inputValue}
          placeholder={placeholder}
          onChange={(event) => setInputValue(event.target.value)}
          onPressEnter={(event) => {
            event.preventDefault();
            addTag(inputValue);
          }}
        />
        <Button type="default" onClick={() => addTag(inputValue)}>
          Add
        </Button>
      </div>
      <div className={styles.tagsContainer}>
        {value.map((tag) => (
          <Tag key={tag} color={tagColor} closable onClose={() => removeTag(tag)}>
            {tag}
          </Tag>
        ))}
      </div>
      {suggestions && suggestions.length > 0 ? (
        <div className={styles.tagSuggestions}>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              size="small"
              type="text"
              className={styles.suggestionChip}
              onClick={() => addTag(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
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
  const [toneAdjectives, setToneAdjectives] = useState<string[]>([]);
  const [toneDos, setToneDos] = useState<string[]>([""]);
  const [toneDonts, setToneDonts] = useState<string[]>([""]);
  const [audienceTags, setAudienceTags] = useState<string[]>([]);
  const [knowledgeProducts, setKnowledgeProducts] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>("");
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [meloGoals, setMeloGoals] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ brandName?: string; industry?: string }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "select"; companyId: string }
    | { type: "add" }
    | null
  >(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState("");

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      { title: "Basic Info", subtitle: "Brand essentials" },
      { title: "Voice & Audience", subtitle: "Tone and target" },
      { title: "Products & Knowledge", subtitle: "Offerings and context" },
      { title: "Assets", subtitle: "Files and visuals" },
      { title: "Goals & Review", subtitle: "Finalize" },
    ],
    []
  );

  const markDirty = () => {
    if (!isDirty) {
      setIsDirty(true);
    }
    if (saveStatus !== "unsaved") {
      setSaveStatus("unsaved");
    }
  };

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    const loadAllData = async () => {
      if (isDataLoaded) return;

      if (isDemoMode()) {
        const demo = await demoBrandProfile.getProfile();
        const demoCompany = createDefaultCompany(demo.brandName || "Maya’s Cake Studio");
        const demoCompanyData = {
          ...demoCompany,
          brandName: demo.brandName,
          industry: demo.industry,
          toneOfVoice: demo.toneOfVoice,
          customTone: demo.customTone,
          targetAudience: demo.targetAudience,
          knowledgeProducts: demo.knowledgeProducts,
          companyDescription: demo.companyDescription,
          productTypes: demo.productTypes,
          productImages: demo.productImages,
          meloGoals: demo.meloGoals,
        };
        setCompanies([demoCompanyData]);
        setSelectedCompanyId(demoCompanyData.id);
        loadCompanyData(demoCompanyData);
        setIsDataLoaded(true);
        return;
      }

      if (isLoggedIn) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);

            if (currentUser.companies && currentUser.companies.length > 0) {
              setCompanies(currentUser.companies as CompanyData[]);
              localStorage.setItem(
                "melo_companies",
                JSON.stringify(currentUser.companies)
              );

              const savedSelectedId = localStorage.getItem(
                "melo_selected_company"
              );
              let companyToLoad = currentUser.companies[0] as CompanyData;

              if (
                savedSelectedId &&
                currentUser.companies.find((c: any) => c.id === savedSelectedId)
              ) {
                const found: any = currentUser.companies.find(
                  (c: any) => c.id === savedSelectedId
                );
                if (found) {
                  companyToLoad = {
                    ...companyToLoad,
                    ...found,
                    toneAdjectives: found.toneAdjectives || [],
                    toneDos: found.toneDos || [],
                    toneDonts: found.toneDonts || [],
                  } as CompanyData;
                }
                setSelectedCompanyId(savedSelectedId);
              } else {
                setSelectedCompanyId(companyToLoad.id);
                localStorage.setItem("melo_selected_company", companyToLoad.id);
              }

              loadCompanyData(companyToLoad);
              setIsDataLoaded(true);
              return;
            }
          }
        } catch (error) {
          console.error("[BrandProfile] Error loading data:", error);
        }
      }

      const savedCompanies = localStorage.getItem("melo_companies");
      const savedSelectedId = localStorage.getItem("melo_selected_company");

      if (savedCompanies) {
        try {
          const parsed = JSON.parse(savedCompanies) as CompanyData[];
          if (parsed.length > 0) {
            setCompanies(parsed);
            const selected =
              parsed.find((company) => company.id === savedSelectedId) || parsed[0];
            setSelectedCompanyId(selected.id);
            loadCompanyData(selected);
            setIsDataLoaded(true);
            return;
          }
        } catch (error) {
          console.error("[BrandProfile] Error parsing local data:", error);
        }
      }

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

  useEffect(() => {
    if (isLoggedIn) {
      const today = new Date().toDateString();
      const lastTipDate = localStorage.getItem("elo-brand-tip-date");

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
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn]);

  const loadCompanyData = (company: CompanyData) => {
    setBrandName(company.brandName || "");
    setIndustry(company.industry || "");
    const toneOfVoice = company.toneOfVoice || "calm";
    const isCustomTone = !toneOptions.some((tone) => tone.key === toneOfVoice);
    if (isCustomTone && toneOfVoice) {
      setSelectedTone("custom");
      setCustomTone(company.customTone || toneOfVoice);
      setShowCustomToneInput(true);
    } else {
      setSelectedTone(toneOfVoice);
      setCustomTone(company.customTone || "");
      setShowCustomToneInput(toneOfVoice === "custom");
    }
    setToneAdjectives(company.toneAdjectives || []);
    setToneDos(company.toneDos && company.toneDos.length ? company.toneDos : [""]);
    setToneDonts(
      company.toneDonts && company.toneDonts.length ? company.toneDonts : [""]
    );
    setKnowledgeProducts(company.knowledgeProducts || []);
    setAudienceTags(company.targetAudience || []);
    setCompanyDescription(company.companyDescription || "");
    setBrandLogoUrl(company.brandLogoUrl || "");
    setProductTypes(company.productTypes || []);
    setProductImages(company.productImages || []);
    setMeloGoals(company.meloGoals || []);
    setFieldErrors({});
    setStepError("");
    setCurrentStep(0);
    setIsDirty(false);
    setSaveStatus("saved");
  };

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
          name: brandName.trim() || company.name,
          brandName: brandName.trim(),
          industry,
          toneOfVoice,
          customTone: customTone.trim(),
          toneAdjectives,
          toneDos: toneDos.filter((item) => item.trim()),
          toneDonts: toneDonts.filter((item) => item.trim()),
          knowledgeProducts,
          targetAudience: audienceTags,
          companyDescription: companyDescription.trim(),
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

  const handleSelectCompany = (companyId: string) => {
    if (companyId === selectedCompanyId) return;
    if (isDirty) {
      setPendingAction({ type: "select", companyId });
      setShowUnsavedModal(true);
      return;
    }
    setSelectedCompanyId(companyId);
    localStorage.setItem("melo_selected_company", companyId);
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      loadCompanyData(company);
    }
  };

  const handleAddCompany = () => {
    if (isDirty) {
      setPendingAction({ type: "add" });
      setShowUnsavedModal(true);
      return;
    }

    const existingNames = companies.map((company) => company.name);
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
    setSelectedCompanyId(newCompany.id);
    localStorage.setItem("melo_selected_company", newCompany.id);
    loadCompanyData(newCompany);
    message.success("New company created. Fill in the details below.");
  };

  const handleDeleteCompany = (companyId: string) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company) return;

    const updatedCompanies = companies.filter((item) => item.id !== companyId);
    setCompanies(updatedCompanies);
    localStorage.setItem("melo_companies", JSON.stringify(updatedCompanies));

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

  const handleEditCompanyName = (companyId: string) => {
    const company = companies.find((item) => item.id === companyId);
    if (company) {
      setEditingCompanyId(companyId);
      setEditingCompanyName(company.name);
    }
  };

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
    markDirty();
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
    markDirty();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FilePdfOutlined className={styles.fileTypeIcon} />;
    }
    if (ext && ["xlsx", "xls", "csv"].includes(ext)) {
      return <FileExcelOutlined className={styles.fileTypeIcon} />;
    }
    if (ext && ["doc", "docx", "txt"].includes(ext)) {
      return <FileTextOutlined className={styles.fileTypeIcon} />;
    }
    return <FileUnknownOutlined className={styles.fileTypeIcon} />;
  };

  const uploadSingleFile = async (file: UploadFile) => {
    if (!file.originFileObj) return;
    setUploadedFiles((prev) =>
      prev.map((item) =>
        item.uid === file.uid ? { ...item, status: "uploading" } : item
      )
    );

    try {
      const response = await uploadService.uploadFile(file.originFileObj);
      if (response.success && response.fileUrl) {
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.uid === file.uid
              ? {
                  ...item,
                  status: "done",
                  url: response.fileUrl,
                  response,
                }
              : item
          )
        );
        message.success(`${file.name} uploaded successfully`);
      } else {
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.uid === file.uid
              ? { ...item, status: "error", response }
              : item
          )
        );
        message.error(
          `Failed to upload ${file.name}: ${response.message || "Unknown error"}`
        );
      }
    } catch (error: any) {
      setUploadedFiles((prev) =>
        prev.map((item) =>
          item.uid === file.uid
            ? { ...item, status: "error", response: { error: error.message } }
            : item
        )
      );
      message.error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const handleFileUpload: UploadProps["onChange"] = async ({ fileList }) => {
    setUploadedFiles(fileList);
    markDirty();

    const newFiles = fileList.filter(
      (file) => file.status === "uploading" || file.status === undefined
    );

    for (const file of newFiles) {
      if (file.originFileObj) {
        await uploadSingleFile(file);
      }
    }
  };

  const handleRemoveFile = (file: UploadFile) => {
    setUploadedFiles(uploadedFiles.filter((item) => item.uid !== file.uid));
    markDirty();
  };

  const handleRetryFile = (file: UploadFile) => {
    uploadSingleFile(file);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAddProduct = () => {
    const trimmed = newProduct.trim();
    if (!trimmed || knowledgeProducts.includes(trimmed)) {
      return;
    }
    setKnowledgeProducts([...knowledgeProducts, trimmed]);
    setNewProduct("");
    markDirty();
  };

  const handleRemoveProduct = (productToRemove: string) => {
    setKnowledgeProducts(
      knowledgeProducts.filter((product) => product !== productToRemove)
    );
    markDirty();
  };

  const updateToneRow = (
    values: string[],
    index: number,
    nextValue: string
  ) => {
    const next = values.map((item, idx) => (idx === index ? nextValue : item));
    return next;
  };

  const validateStep = (stepIndex: number) => {
    if (stepIndex !== 0) {
      setStepError("");
      return true;
    }

    const errors: { brandName?: string; industry?: string } = {};
    if (!brandName.trim()) {
      errors.brandName = "Brand name is required";
    }
    if (!industry.trim()) {
      errors.industry = "Industry is required";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStepError("Please fix required fields.");
      return false;
    }

    setStepError("");
    return true;
  };

  const validateAllRequired = () => {
    const errors: { brandName?: string; industry?: string } = {};
    if (!brandName.trim()) {
      errors.brandName = "Brand name is required";
    }
    if (!industry.trim()) {
      errors.industry = "Industry is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveProfile = async () => {
    if (!validateAllRequired()) {
      setStepError("Please fix required fields.");
      setCurrentStep(0);
      message.error("Please complete required fields before saving.");
      return false;
    }

    setLoading(true);
    setSaveStatus("saving");
    try {
      const toneOfVoice =
        selectedTone === "custom" && customTone.trim()
          ? customTone.trim()
          : selectedTone;

      saveCurrentToCompany();

      const response = await authService.updateProfile({
        brandName: brandName.trim(),
        industry: industry.trim(),
        toneOfVoice,
        knowledgeProducts,
        targetAudience: audienceTags,
        companyDescription: companyDescription.trim(),
      });

      if (response.success && response.user) {
        setUser(response.user);
        onLoginSuccess(response.user);
        setSaveStatus("saved");
        setIsDirty(false);
        setLastSavedAt(new Date());
        message.success("Saved");
        return true;
      }

      message.error(response.message || "Failed to save profile");
      setSaveStatus("unsaved");
      return false;
    } catch (error) {
      message.error("An error occurred while saving profile");
      setSaveStatus("unsaved");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUnsavedAction = async (action: "discard" | "save") => {
    if (!pendingAction) return;

    if (action === "save") {
      const saved = await handleSaveProfile();
      if (!saved) return;
    }

    if (pendingAction.type === "select") {
      setSelectedCompanyId(pendingAction.companyId);
      localStorage.setItem("melo_selected_company", pendingAction.companyId);
      const company = companies.find((item) => item.id === pendingAction.companyId);
      if (company) {
        loadCompanyData(company);
      }
    }

    if (pendingAction.type === "add") {
      const existingNames = companies.map((company) => company.name);
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
      setSelectedCompanyId(newCompany.id);
      localStorage.setItem("melo_selected_company", newCompany.id);
      loadCompanyData(newCompany);
      message.success("New company created. Fill in the details below.");
    }

    setPendingAction(null);
    setShowUnsavedModal(false);
    if (action === "discard") {
      setIsDirty(false);
      setSaveStatus("saved");
    }
  };

  const saveLabel = useMemo(() => {
    if (saveStatus === "saving") return "Saving";
    if (saveStatus === "unsaved") return "Unsaved";
    if (!lastSavedAt) return "Saved";
    const diff = Date.now() - lastSavedAt.getTime();
    if (diff < 60000) return "Saved just now";
    const formatted = lastSavedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Saved at ${formatted}`;
  }, [saveStatus, lastSavedAt]);

  const requiredFields = useMemo(
    () => [
      {
        key: "brandName",
        label: "Brand Name",
        missing: !brandName.trim(),
        step: 0,
      },
      {
        key: "industry",
        label: "Industry",
        missing: !industry.trim(),
        step: 0,
      },
    ],
    [brandName, industry]
  );

  const missingRequired = requiredFields.filter((field) => field.missing);

  const stepCompletion = useMemo(() => {
    const toneCustomText = customTone.trim();
    const toneDetails =
      toneCustomText ||
      toneAdjectives.length > 0 ||
      toneDos.some((item) => item.trim()) ||
      toneDonts.some((item) => item.trim());

    return [
      brandName.trim() && industry.trim(),
      audienceTags.length > 0 || !!toneDetails,
      knowledgeProducts.length > 0 || productTypes.length > 0,
      uploadedFiles.length > 0 || productImages.length > 0,
      meloGoals.length > 0,
    ];
  }, [
    brandName,
    industry,
    audienceTags,
    customTone,
    toneAdjectives,
    toneDos,
    toneDonts,
    knowledgeProducts,
    productTypes,
    uploadedFiles,
    productImages,
    meloGoals,
  ]);

  const completionPercent = Math.round(
    (stepCompletion.filter(Boolean).length / steps.length) * 100
  );

  const audiencePreview = audienceTags.slice(0, 3);
  const audienceMoreCount = audienceTags.length - audiencePreview.length;
  const audienceSummary =
    audienceTags.length === 0
      ? "No tags yet"
      : `${audiencePreview.join(", ")}${
          audienceMoreCount > 0 ? ` +${audienceMoreCount} more` : ""
        }`;

  const canProceedStep1 = brandName.trim() && industry.trim();

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Space direction="vertical" size="large" className={styles.sectionStack}>
          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Basic Info
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Start with the essentials. These are required to continue.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <div className={styles.fieldGroup}>
                <Typography.Text className={styles.fieldLabel}>
                  Brand Name *
                </Typography.Text>
                <Input
                  size="large"
                  placeholder="e.g., Melo Studio"
                  value={brandName}
                  onChange={(event) => {
                    setBrandName(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, brandName: undefined }));
                    markDirty();
                  }}
                />
                {fieldErrors.brandName ? (
                  <Typography.Text className={styles.fieldError}>
                    {fieldErrors.brandName}
                  </Typography.Text>
                ) : null}
              </div>
              <div className={styles.fieldGroup}>
                <Typography.Text className={styles.fieldLabel}>
                  Industry *
                </Typography.Text>
                <Select
                  size="large"
                  value={industry || undefined}
                  onChange={(value) => {
                    setIndustry(value);
                    setFieldErrors((prev) => ({ ...prev, industry: undefined }));
                    markDirty();
                  }}
                  options={industryOptions}
                  placeholder="Select industry"
                  className={styles.fullWidth}
                />
                {fieldErrors.industry ? (
                  <Typography.Text className={styles.fieldError}>
                    {fieldErrors.industry}
                  </Typography.Text>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Company Description
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Recommended for better AI outputs.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <Input.TextArea
                size="large"
                placeholder="Share the mission, what you sell, and what makes you unique. Example: We craft small-batch candles inspired by wellness rituals."
                value={companyDescription}
                onChange={(event) => {
                  setCompanyDescription(event.target.value);
                  markDirty();
                }}
                rows={6}
                maxLength={2000}
                showCount
                className={styles.textArea}
              />
              <Typography.Text type="secondary" className={styles.helperText}>
                Recommended for better AI outputs
              </Typography.Text>
            </div>
          </Card>
        </Space>
      );
    }

    if (currentStep === 1) {
      return (
        <Space direction="vertical" size="large" className={styles.sectionStack}>
          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Tone of Voice
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Pick a style or define a custom voice.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <div className={styles.toneButtons}>
                {toneOptions.map((tone) => (
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
              </div>
              {showCustomToneInput ? (
                <div className={styles.customTone}>
                  <Input
                    size="large"
                    placeholder="Enter custom tone (e.g., refined, playful)"
                    value={customTone}
                    onChange={(event) => {
                      setCustomTone(event.target.value);
                      markDirty();
                    }}
                  />
                  <TagInput
                    value={toneAdjectives}
                    onChange={setToneAdjectives}
                    placeholder="Add adjectives"
                    tagColor="gold"
                    label="Adjectives"
                    hint="Aim for 2-5 descriptive words."
                    onDirty={markDirty}
                  />
                </div>
              ) : null}
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Do / Don't
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Give quick guardrails for messaging.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <div className={styles.doDontGrid}>
                <div>
                  <Typography.Text className={styles.fieldLabel}>Do</Typography.Text>
                  <Space direction="vertical" className={styles.fullWidth}>
                    {toneDos.map((item, index) => (
                      <Input
                        key={`do-${index}`}
                        value={item}
                        placeholder="e.g., Use short, friendly sentences"
                        onChange={(event) => {
                          setToneDos(updateToneRow(toneDos, index, event.target.value));
                          markDirty();
                        }}
                      />
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setToneDos([...toneDos, ""]);
                        markDirty();
                      }}
                    >
                      Add row
                    </Button>
                  </Space>
                </div>
                <div>
                  <Typography.Text className={styles.fieldLabel}>
                    Don't
                  </Typography.Text>
                  <Space direction="vertical" className={styles.fullWidth}>
                    {toneDonts.map((item, index) => (
                      <Input
                        key={`dont-${index}`}
                        value={item}
                        placeholder="e.g., Avoid heavy jargon"
                        onChange={(event) => {
                          setToneDonts(
                            updateToneRow(toneDonts, index, event.target.value)
                          );
                          markDirty();
                        }}
                      />
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setToneDonts([...toneDonts, ""]);
                        markDirty();
                      }}
                    >
                      Add row
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Target Audience
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Who should this brand speak to?
            </Typography.Text>
            <div className={styles.sectionBody}>
              <TagInput
                value={audienceTags}
                onChange={setAudienceTags}
                placeholder="Add audience tags"
                tagColor="blue"
                suggestions={audienceSuggestions}
                onDirty={markDirty}
              />
            </div>
          </Card>
        </Space>
      );
    }

    if (currentStep === 2) {
      return (
        <Space direction="vertical" size="large" className={styles.sectionStack}>
          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Target Knowledge Base
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Add the product lines AI should know about.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <div className={styles.listBlock}>
                {knowledgeProducts.length === 0 ? (
                  <Typography.Text type="secondary">
                    No products added yet.
                  </Typography.Text>
                ) : (
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
                )}
              </div>
              <div className={styles.inlineAdd}>
                <Input
                  placeholder="Add product line"
                  value={newProduct}
                  onChange={(event) => setNewProduct(event.target.value)}
                  onPressEnter={(event) => {
                    event.preventDefault();
                    handleAddProduct();
                  }}
                />
                <Button type="primary" onClick={handleAddProduct}>
                  Add
                </Button>
              </div>
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Product Types
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Reusable tags for products or collections.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <TagInput
                value={productTypes}
                onChange={setProductTypes}
                placeholder="Add product type"
                tagColor="green"
                suggestions={productTypeSuggestions}
                onDirty={markDirty}
              />
            </div>
          </Card>
        </Space>
      );
    }

    if (currentStep === 3) {
      return (
        <Space direction="vertical" size="large" className={styles.sectionStack}>
          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Upload Database
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Upload PDFs, spreadsheets, or docs for knowledge reference.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <Upload.Dragger
                multiple
                fileList={uploadedFiles}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
                className={styles.uploadDragger}
              >
                <p className={styles.uploadIcon}>
                  <UploadOutlined />
                </p>
                <p className={styles.uploadText}>Click or drag files to upload</p>
                <p className={styles.uploadHint}>
                  Supports PDF, Excel, CSV, Word, TXT
                </p>
              </Upload.Dragger>
              {uploadedFiles.length > 0 ? (
                <div className={styles.fileList}>
                  {uploadedFiles.map((file) => (
                    <div key={file.uid} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        {getFileIcon(file.name)}
                        <div className={styles.fileDetails}>
                          <Typography.Text ellipsis className={styles.fileName}>
                            {file.name}
                          </Typography.Text>
                          <Typography.Text type="secondary" className={styles.fileSize}>
                            {file.size ? formatFileSize(file.size) : ""}
                          </Typography.Text>
                          <Typography.Text className={styles.fileStatus}>
                            {file.status === "uploading" && "Uploading"}
                            {file.status === "done" && "Ready"}
                            {file.status === "error" && "Failed"}
                            {!file.status && "Processing"}
                          </Typography.Text>
                        </div>
                      </div>
                      <div className={styles.fileActions}>
                        {file.status === "error" ? (
                          <Button type="link" onClick={() => handleRetryFile(file)}>
                            Retry
                          </Button>
                        ) : null}
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveFile(file)}
                          className={styles.deleteFileBtn}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {uploadedFiles.some((file) => file.status === "uploading") ? (
                <Typography.Text type="secondary" className={styles.processingHint}>
                  Processing...
                </Typography.Text>
              ) : null}
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <Typography.Title level={4} className={styles.sectionTitle}>
              Product Images
            </Typography.Title>
            <Typography.Text type="secondary" className={styles.sectionSubtitle}>
              Upload product or moodboard images.
            </Typography.Text>
            <div className={styles.sectionBody}>
              <Upload
                onChange={(info) => {
                  const file =
                    info.file.originFileObj || (info.file as any).originFileObj || info.file;
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
                    setImageUploading(true);
                    uploadService.uploadImage(file).then((response) => {
                      setImageUploading(false);
                      if (response.success && response.imageUrl) {
                        setProductImages([...productImages, response.imageUrl]);
                        markDirty();
                        message.success("Image uploaded");
                      } else {
                        message.error(response.message || "Failed to upload image");
                      }
                    });
                  }
                }}
                showUploadList={false}
                accept="image/*"
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />} block loading={imageUploading}>
                  Upload Product Image
                </Button>
              </Upload>
              {productImages.length > 0 ? (
                <div className={styles.imageGrid}>
                  {productImages.map((url, index) => (
                    <div key={url} className={styles.imageItem}>
                      <img
                        src={getImageUrl(url)}
                        alt={`Product ${index + 1}`}
                        className={styles.imagePreview}
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setProductImages(
                            productImages.filter((_, itemIndex) => itemIndex !== index)
                          );
                          markDirty();
                        }}
                        className={styles.imageRemove}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </Space>
      );
    }

    return (
      <Space direction="vertical" size="large" className={styles.sectionStack}>
        <Card className={styles.sectionCard}>
          <Typography.Title level={4} className={styles.sectionTitle}>
            Melo Goals
          </Typography.Title>
          <Typography.Text type="secondary" className={styles.sectionSubtitle}>
            Define the outcomes you want Melo to optimize.
          </Typography.Text>
          <div className={styles.sectionBody}>
            <TagInput
              value={meloGoals}
              onChange={setMeloGoals}
              placeholder="Add goal"
              tagColor="purple"
              suggestions={goalSuggestions}
              onDirty={markDirty}
            />
          </div>
        </Card>

        <Card className={styles.sectionCard}>
          <Typography.Title level={4} className={styles.sectionTitle}>
            Review Summary
          </Typography.Title>
          <Typography.Text type="secondary" className={styles.sectionSubtitle}>
            Check required fields before saving.
          </Typography.Text>
          <div className={styles.sectionBody}>
            <div className={styles.reviewGrid}>
              <div>
                <Typography.Text className={styles.reviewLabel}>Brand</Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {brandName || "-"}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className={styles.reviewLabel}>Industry</Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {industry || "-"}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className={styles.reviewLabel}>Tone</Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {selectedTone === "custom" && customTone.trim()
                    ? customTone
                    : toneOptions.find((tone) => tone.key === selectedTone)?.label ||
                      selectedTone}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className={styles.reviewLabel}>Audience</Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {audienceTags.length} tags
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className={styles.reviewLabel}>
                  Products count
                </Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {knowledgeProducts.length}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className={styles.reviewLabel}>Assets</Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {uploadedFiles.length + productImages.length}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className={styles.reviewLabel}>Goals</Typography.Text>
                <Typography.Text className={styles.reviewValue}>
                  {meloGoals.length}
                </Typography.Text>
              </div>
            </div>
            {missingRequired.length > 0 ? (
              <div className={styles.reviewMissing}>
                <Typography.Text className={styles.fieldError}>
                  Required fields missing:
                </Typography.Text>
                <div className={styles.reviewLinks}>
                  {missingRequired.map((field) => (
                    <Button
                      key={field.key}
                      type="link"
                      onClick={() => setCurrentStep(field.step)}
                    >
                      {field.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <Typography.Text className={styles.reviewComplete}>
                All required fields completed.
              </Typography.Text>
            )}
          </div>
        </Card>
      </Space>
    );
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
      <div className={styles.stickyHeader}>
        <div className={styles.headerLeft}>
          <Select
            value={selectedCompanyId || undefined}
            onChange={(value) => handleSelectCompany(value)}
            showSearch
            optionFilterProp="label"
            placeholder="Select company"
            className={styles.companySelect}
            dropdownRender={(menu) => (
              <div className={styles.companyDropdown}>
                {menu}
                <div className={styles.companyDropdownActions}>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleAddCompany}
                    className={styles.companyDropdownBtn}
                  >
                    Add new company
                  </Button>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() =>
                      selectedCompanyId && handleEditCompanyName(selectedCompanyId)
                    }
                    className={styles.companyDropdownBtn}
                  >
                    Edit company
                  </Button>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      selectedCompanyId && handleDeleteCompany(selectedCompanyId)
                    }
                    className={styles.companyDropdownBtn}
                  >
                    Delete company
                  </Button>
                </div>
              </div>
            )}
            options={companies.map((company) => ({
              value: company.id,
              label: company.name,
            }))}
          />
        </div>
        <div className={styles.headerCenter}>
          <Typography.Title level={1} className={styles.pageTitle}>
            Brand Profile
          </Typography.Title>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.saveStatusBlock}>
            <Typography.Text className={styles.saveStatus}>{saveLabel}</Typography.Text>
            {isDirty ? (
              <Typography.Text className={styles.unsavedHint}>
                Unsaved changes
              </Typography.Text>
            ) : null}
          </div>
          <Button
            type="primary"
            size="large"
            onClick={handleSaveProfile}
            loading={loading}
            className={styles.saveButton}
            data-demo-id="brand-profile-save"
          >
            Save
          </Button>
        </div>
      </div>
      <Content className={styles.content}>
        <div className={styles.mainLayout}>
          <aside className={styles.stepperColumn}>
            <div className={styles.stepper}>
              <div className={styles.stepperCompact}>
                Step {currentStep + 1}/{steps.length} - {steps[currentStep].title}
              </div>
              <div className={styles.stepperList}>
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = stepCompletion[index];
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`${styles.stepperItem} ${
                        isActive ? styles.stepperItemActive : ""
                      } ${isComplete ? styles.stepperItemComplete : ""}`}
                    >
                      <span className={styles.stepperIndicator}>
                        {isComplete ? (
                          <CheckOutlined />
                        ) : (
                          <span className={styles.stepperNumber}>{index + 1}</span>
                        )}
                      </span>
                      <span className={styles.stepperText}>
                        <span className={styles.stepperTitle}>{step.title}</span>
                        <span className={styles.stepperSubtitle}>{step.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className={styles.formColumn} data-demo-id="brand-profile-form">
            <div className={styles.stepHeader}>
              <Typography.Text className={styles.stepHeaderLabel}>
                Step {currentStep + 1}
              </Typography.Text>
              <Typography.Title level={2} className={styles.stepHeaderTitle}>
                {steps[currentStep].title}
              </Typography.Title>
              <Typography.Text className={styles.stepHeaderSubtitle}>
                {steps[currentStep].subtitle}
              </Typography.Text>
            </div>
            {stepError ? (
              <div className={styles.stepErrorBanner}>{stepError}</div>
            ) : null}

            <div className={styles.stepContent}>{renderStepContent()}</div>

            <div className={styles.stepNav}>
              <Button onClick={handleBack} disabled={currentStep === 0}>
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={handleNext}
                  disabled={currentStep === 0 && !canProceedStep1}
                >
                  Next
                </Button>
              ) : (
                <Button type="primary" onClick={handleSaveProfile} loading={loading}>
                  Save
                </Button>
              )}
            </div>
          </main>

          <aside className={styles.summaryColumn}>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <Typography.Text className={styles.summaryTitle}>
                  Profile Summary
                </Typography.Text>
                <Typography.Text className={styles.summaryPercent}>
                  {completionPercent}%
                </Typography.Text>
              </div>
              <Progress
                percent={completionPercent}
                showInfo={false}
                strokeColor="#10b981"
                className={styles.summaryProgress}
              />

              <div className={styles.summarySection}>
                <Typography.Text className={styles.summaryLabel}>
                  Required checklist
                </Typography.Text>
                {missingRequired.length === 0 ? (
                  <Typography.Text className={styles.summaryComplete}>
                    All required fields completed
                  </Typography.Text>
                ) : (
                  <div className={styles.summaryChecklist}>
                    {missingRequired.map((field) => (
                      <Button
                        key={field.key}
                        type="link"
                        onClick={() => setCurrentStep(field.step)}
                        className={styles.summaryLink}
                      >
                        {field.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.summarySection}>
                <Typography.Text className={styles.summaryLabel}>
                  Current selections
                </Typography.Text>
                <div className={styles.summaryList}>
                  <div>
                    <Typography.Text className={styles.summaryItemLabel}>
                      Tone
                    </Typography.Text>
                    <Typography.Text className={styles.summaryItemValue}>
                      {selectedTone === "custom" && customTone.trim()
                        ? customTone
                        : toneOptions.find((tone) => tone.key === selectedTone)?.label ||
                          selectedTone}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text className={styles.summaryItemLabel}>
                      Audience
                    </Typography.Text>
                    <Typography.Text className={styles.summaryItemValue}>
                      {audienceSummary}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text className={styles.summaryItemLabel}>
                      Goals
                    </Typography.Text>
                    <Typography.Text className={styles.summaryItemValue}>
                      {meloGoals.length} goals
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text className={styles.summaryItemLabel}>
                      Products
                    </Typography.Text>
                    <Typography.Text className={styles.summaryItemValue}>
                      {knowledgeProducts.length}
                    </Typography.Text>
                  </div>
                </div>
              </div>

              <div className={styles.summarySection}>
                <Typography.Text className={styles.summaryLabel}>
                  Jump to
                </Typography.Text>
                <div className={styles.summaryLinks}>
                  {steps.map((step, index) => (
                    <Button
                      key={step.title}
                      type="text"
                      onClick={() => setCurrentStep(index)}
                      className={styles.summaryLink}
                    >
                      {step.title}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </Content>

      <Modal
        open={showUnsavedModal}
        onCancel={() => {
          setShowUnsavedModal(false);
          setPendingAction(null);
        }}
        title="Unsaved changes"
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowUnsavedModal(false);
              setPendingAction(null);
            }}
          >
            Cancel
          </Button>,
          <Button key="discard" onClick={() => handleUnsavedAction("discard")} danger>
            Discard
          </Button>,
          <Button key="save" type="primary" onClick={() => handleUnsavedAction("save")}>
            Save & Switch
          </Button>,
        ]}
      >
        <Typography.Text>
          You have unsaved changes. Do you want to discard them or save before
          switching?
        </Typography.Text>
      </Modal>

      <Modal
        open={!!editingCompanyId}
        onCancel={() => {
          setEditingCompanyId(null);
          setEditingCompanyName("");
        }}
        title="Edit company name"
        okText="Save"
        onOk={handleSaveCompanyName}
      >
        <Input
          value={editingCompanyName}
          onChange={(event) => setEditingCompanyName(event.target.value)}
        />
      </Modal>
    </Layout>
  );
}
