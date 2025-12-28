"use client";

import Image from "next/image";
import { type ChangeEvent, type ComponentType, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ChevronLeft,
  CalendarDays,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MapPin,
  Plus,
  Settings,
  Trees,
  UsersRound,
} from "lucide-react";

import { FamilySidebar } from "../../components/family-sidebar";
import { FamilyTreeLogo } from "../../components/icons/family-tree-logo";
import { PersonIcon, CalendarIcon } from "../../components/icons/achievement-metadata";

type AchievementIcon = ComponentType<{ className?: string }>;

// Icon path mapping for each category
const ACHIEVEMENT_ICON_CONFIG: Record<string, { iconPath: string; background: string }> = {
  Education: { iconPath: "/icons/cup.png", background: "#E0F2FE" },
  Graduation: { iconPath: "/icons/cup.png", background: "#E0F2FE" },
  Career: { iconPath: "/icons/career.png", background: "#E7DDFB" },
  Business: { iconPath: "/icons/career.png", background: "#E7DDFB" },
  Sport: { iconPath: "/icons/sport.png", background: "#F8F1C2" },
  Sports: { iconPath: "/icons/sport.png", background: "#F8F1C2" },
  Health: { iconPath: "/icons/health.png", background: "#F8D6D6" },
  Artistic: { iconPath: "/icons/artist.png", background: "#BAE6FD" },
  Creative: { iconPath: "/icons/artist.png", background: "#BAE6FD" },
  Community: { iconPath: "/icons/community.png", background: "#DBEAFE" },
  Environment: { iconPath: "/icons/enviroment.png", background: "#E0F3D3" },
  Financial: { iconPath: "/icons/finance.png", background: "#FAE5D3" },
  Finance: { iconPath: "/icons/finance.png", background: "#FAE5D3" },
  "Skill Development": { iconPath: "/icons/skill.png", background: "#E7DDFB" },
  Travel: { iconPath: "/icons/travel.png", background: "#D1F2EB" },
  Passing: { iconPath: "/icons/passing.png", background: "#D9D9D9" },
  Married: { iconPath: "/icons/ket_hon.png", background: "#F8D6D6" },
  Marriage: { iconPath: "/icons/ket_hon.png", background: "#F8D6D6" },
  Divorce: { iconPath: "/icons/broken.png", background: "#E7DDFB" },
  Birth: { iconPath: "/icons/birth.png", background: "#D6EEFF" },
};


interface AchievementEntry {
  id: string;
  category: string;
  title: string;
  person: string;
  date: string;
  rawDate?: string; // YYYY-MM-DD format for edit form
  description: string;
  background: string;
  iconPath: string;
}

interface PassingEntry {
  id: string;
  year: string;
  title: string;
  person: string;
  date: string;
  location: string;
  cause: string;
  causes: string[];
  burialPlaces: { location: string; startDate: string }[];
  iconPath: string;
}

interface LifeEventEntry {
  id: string;
  year: string;
  title: string;
  date: string;
  rawDate?: string; // YYYY-MM-DD format for edit form
  description: string;
  background: string;
  iconSrc: string;
  eventType: "marriage" | "divorce";
  member1: string;
  member2: string;
  relationshipId?: number; // Original relationship ID for updates
}

type AchievementFormData = Pick<
  AchievementEntry,
  "category" | "date" | "description" | "person" | "title"
>;

const initialAchievementSections: { year: string; entries: AchievementEntry[] }[] = [
  {
    year: "2025",
    entries: [
      {
        id: "graduation",
        category: "Graduation",
        title: "Master's Degree in Computer Science",
        person: "Ruben Hunter",
        date: "May 15, 2025",
        description:
          "Ruben graduated with honors from MIT with a Master's Degree in Computer Science.",
        background: "#D6EEFF",
        iconPath: "/icons/cup.png",
      },
      {
        id: "career",
        category: "Career",
        title: "Established \"Hunter & Sons\" Law Firm",
        person: "Forrest Hunter",
        date: "December 1, 2025",
        description:
          "Forrest founded and scaled Hunter & Sons into a leading regional corporate litigation firm.",
        background: "#E7DDFB",
        iconPath: "/icons/career.png",
      },
      {
        id: "sport",
        category: "Sport",
        title: "Won State Basketball Championship",
        person: "Geoffrey",
        date: "March 12, 2025",
        description:
          "Geoffrey was the MVP of the 2005 State Championship, showcasing exceptional teamwork and skill.",
        background: "#F8F1C2",
        iconPath: "/icons/sport.png",
      },
      {
        id: "health",
        category: "Health",
        title: "Completed 75 Hard Fitness Challenge",
        person: "Ruben Hunter",
        date: "October 20, 2025",
        description:
          "Ruben finished the intense 75 Hard program, improving discipline and overall health.",
        background: "#F8D6D6",
        iconPath: "/icons/health.png",
      },
    ],
  },
  {
    year: "2024",
    entries: [
      {
        id: "environment",
        category: "Environment",
        title: "Launched Community Recycling Initiative",
        person: "Corad Hunter",
        date: "June 5, 2024",
        description:
          "Corad led a neighborhood-wide multi-sort recycling program that boosted sustainability efforts.",
        background: "#E0F3D3",
        iconPath: "/icons/enviroment.png",
      },
      {
        id: "artistic",
        category: "Artistic",
        title: "Published Debut Science Fiction Novel",
        person: "Josh Cooper",
        date: "September 15, 2024",
        description:
          'Josh released "The Chronos Fragment," which quickly became a bestseller on indie charts.',
        background: "#CCE7F8",
        iconPath: "/icons/artist.png",
      },
    ],
  },
];

const passingSections: { year: string; entries: PassingEntry[] }[] = [
  {
    year: "2015",
    entries: [
      {
        id: "thomas",
        year: "2015",
        title: "The passing of Thomas",
        person: "Thomas",
        date: "08/15/2015",
        location: "Family Tomb Area in Dong Nai",
        cause: "Causes: Stage IV pancreatic cancer and severe weight loss.",
        causes: ["Stage IV pancreatic cancer", "Severe weight loss"],
        burialPlaces: [
          { location: "Family Tomb Area, Dong Nai", startDate: "08/20/2015" },
        ],
        iconPath: "/icons/passing.png",
      },
    ],
  },
  {
    year: "2010",
    entries: [
      {
        id: "pablo",
        year: "2010",
        title: "The passing of Pablo",
        person: "Pablo",
        date: "11/22/2010",
        location: "Vinh Hang Memorial Park, Ha Noi",
        cause:
          "Causes: Advanced Alzheimer's disease, respiratory failure, pneumonia, and general physical debilitation.",
        causes: [
          "Advanced Alzheimer's disease",
          "Respiratory failure",
          "Pneumonia",
          "General physical debilitation.",
        ],
        burialPlaces: [
          { location: "Lac Canh Vien Cemetery, Hoa Binh", startDate: "11/22/2010" },
          { location: "Vinh Hang Memorial Park, Ha Noi", startDate: "12/12/2011" },
        ],
        iconPath: "/icons/passing.png",
      },
    ],
  },
];

const lifeEventSections: { year: string; entries: LifeEventEntry[] }[] = [
  {
    year: "2018",
    entries: [
      {
        id: "geoffrey-wedding",
        year: "2018",
        title: "Forrest & Geoffrey Say \"I Do\"",
        date: "05/20/2018",
        description:
          "Happiness starts here! The couple held an intimate ceremony, marking the beginning of a new chapter in their lives.",
        background: "#FECACA",
        iconSrc: "/icons/ket_hon.png",
        eventType: "marriage",
        member1: "Forrest Hunter",
        member2: "Geoffrey",
      },
      {
        id: "forrest-divorce",
        year: "2018",
        title: "Forrest's Separation from Ryan",
        date: "05/11/2016",
        description:
          "The end of a relationship. The two agreed to separate peacefully and move on with their individual lives.",
        background: "#DCCCF4",
        iconSrc: "/icons/broken.png",
        eventType: "divorce",
        member1: "Forrest Hunter",
        member2: "Ryan",
      },
      {
        id: "ruben-wedding",
        year: "2018",
        title: "Ruben Weds Josh",
        date: "11/14/2015",
        description:
          "A beautiful love story is witnessed. Hope they build a lasting, happy family together.",
        background: "#FECACA",
        iconSrc: "/icons/ket_hon.png",
        eventType: "marriage",
        member1: "Ruben Hunter",
        member2: "Josh Cooper",
      },
      {
        id: "conrad-wedding",
        year: "2018",
        title: "Conrad Ties the Knot with Salvatore",
        date: "11/14/2015",
        description:
          "A beautiful love story is witnessed. Hope they build a lasting, happy family together.",
        background: "#FECACA",
        iconSrc: "/icons/ket_hon.png",
        eventType: "marriage",
        member1: "Conrad Hunter",
        member2: "Salvatore",
      },
    ],
  },
];

// familyTrees will be loaded from API
// const familyTrees = [...] - removed, now dynamic

const sidebarNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "#" },
  { id: "family-tree", label: "Family Tree", icon: Trees, href: "#" },
  { id: "members", label: "Members", icon: UsersRound, href: "#" },
  {
    id: "life-event",
    label: "Life Event",
    icon: ListChecks,
    href: "/Achievement_list",
    active: true,
  },
  { id: "reports", label: "Reports", icon: LineChart, href: "#" },
  { id: "settings", label: "Settings", icon: Settings, href: "#" },
];

const achievementTabs = [
  { id: "Achievement", label: "Achievement", variant: "left" },
  { id: "Passing", label: "Passing", variant: "middle" },
  { id: "Life Event", label: "Life Event", variant: "right" },
];

export default function AchievementListPage() {
  const [activeTab, setActiveTab] = useState<string>("Achievement");
  const isPassingView = activeTab === "Passing";
  const isLifeEventView = activeTab === "Life Event";
  const [achievementSections, setAchievementSections] = useState(initialAchievementSections);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementEntry | null>(null);
  const [selectedAchievementYear, setSelectedAchievementYear] = useState<string | null>(null);
  const [isEditingAchievement, setIsEditingAchievement] = useState(false);
  const [achievementFormData, setAchievementFormData] = useState<AchievementFormData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false);
  const [newAchievementFormData, setNewAchievementFormData] = useState({
    person: "",
    category: "",
    date: "",
    title: "",
    description: "",
  });

  // Life Event modal states
  const [selectedLifeEvent, setSelectedLifeEvent] = useState<LifeEventEntry | null>(null);
  const [selectedLifeEventYear, setSelectedLifeEventYear] = useState<string | null>(null);
  const [isEditingLifeEvent, setIsEditingLifeEvent] = useState(false);
  const [lifeEventFormData, setLifeEventFormData] = useState<{ member1: string; member2: string; date: string } | null>(null);
  const [lifeEventSectionsState, setLifeEventSectionsState] = useState(lifeEventSections);

  // Passing modal states
  const [selectedPassing, setSelectedPassing] = useState<PassingEntry | null>(null);
  const [selectedPassingYear, setSelectedPassingYear] = useState<string | null>(null);
  const [isEditingPassing, setIsEditingPassing] = useState(false);
  const [passingFormData, setPassingFormData] = useState<{
    person: string;
    date: string;
    causes: string[];
    burialPlaces: { location: string; startDate: string }[];
  } | null>(null);
  const [passingSectionsState, setPassingSectionsState] = useState(passingSections);

  // ===== NEW: API Data States =====
  const [familyTrees, setFamilyTrees] = useState<{ id: string; name: string; href?: string; active?: boolean }[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [selectedTreeName, setSelectedTreeName] = useState<string>("Loading...");
  const [hasMoreTrees, setHasMoreTrees] = useState(false);

  // Filter states
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<{ id: string; name: string }[]>([]);
  const [availableMembers, setAvailableMembers] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown visibility states
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // ===== Fetch Family Trees on mount =====
  useEffect(() => {
    async function fetchFamilyTrees() {
      try {
        const res = await fetch("/api/family-trees");
        const data = await res.json();
        if (data.trees && data.trees.length > 0) {
          const trees = data.trees.map((t: { id: string; name: string }, index: number) => ({
            ...t,
            href: "#",
            active: index === 0,
          }));
          setFamilyTrees(trees);
          setSelectedTreeId(trees[0].id);
          setSelectedTreeName(trees[0].name);
          setHasMoreTrees(data.hasMore);
        }
      } catch (error) {
        console.error("Failed to fetch family trees:", error);
      }
    }
    fetchFamilyTrees();
  }, []);

  // ===== Fetch Achievement Types when tree is selected =====
  useEffect(() => {
    async function fetchAchievementTypes() {
      if (!selectedTreeId) return;
      try {
        const res = await fetch(`/api/achievement-types?treeId=${selectedTreeId}`);
        const data = await res.json();
        setAvailableTypes(data.types || []);
      } catch (error) {
        console.error("Failed to fetch achievement types:", error);
      }
    }
    fetchAchievementTypes();
  }, [selectedTreeId]);

  // ===== Fetch Family Members when tree is selected =====
  useEffect(() => {
    async function fetchFamilyMembers() {
      if (!selectedTreeId) return;
      try {
        const res = await fetch(`/api/family-members?treeId=${selectedTreeId}`);
        const data = await res.json();
        setAvailableMembers(data.members || []);
      } catch (error) {
        console.error("Failed to fetch family members:", error);
      }
    }
    fetchFamilyMembers();
  }, [selectedTreeId]);

  // ===== Fetch Achievements when tree, year, or type filter changes =====
  const fetchAchievements = useCallback(async () => {
    if (!selectedTreeId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ treeId: selectedTreeId });
      if (yearFilter !== "all") params.append("year", yearFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const res = await fetch(`/api/achievements?${params}`);
      const data = await res.json();
      setAchievementSections(data.sections || []);
      setAvailableYears(data.availableYears || []);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTreeId, yearFilter, typeFilter]);

  // ===== Fetch Passing Records =====
  const fetchPassingRecords = useCallback(async () => {
    if (!selectedTreeId) return;
    try {
      const params = new URLSearchParams({ treeId: selectedTreeId });
      if (yearFilter !== "all") params.append("year", yearFilter);

      const res = await fetch(`/api/passing-records?${params}`);
      const data = await res.json();
      setPassingSectionsState(data.sections || []);
    } catch (error) {
      console.error("Failed to fetch passing records:", error);
    }
  }, [selectedTreeId, yearFilter]);

  // ===== Fetch Life Events =====
  const fetchLifeEvents = useCallback(async () => {
    if (!selectedTreeId) return;
    try {
      const params = new URLSearchParams({ treeId: selectedTreeId });
      if (yearFilter !== "all") params.append("year", yearFilter);

      const res = await fetch(`/api/life-events?${params}`);
      const data = await res.json();
      setLifeEventSectionsState(data.sections || []);
    } catch (error) {
      console.error("Failed to fetch life events:", error);
    }
  }, [selectedTreeId, yearFilter]);

  // ===== Trigger data fetching based on active tab =====
  useEffect(() => {
    if (!selectedTreeId) return;

    if (activeTab === "Achievement") {
      fetchAchievements();
    } else if (activeTab === "Passing") {
      fetchPassingRecords();
    } else if (activeTab === "Life Event") {
      fetchLifeEvents();
    }
  }, [activeTab, selectedTreeId, yearFilter, typeFilter, fetchAchievements, fetchPassingRecords, fetchLifeEvents]);

  // ===== Handle tree selection =====
  const handleTreeSelect = (treeId: string, treeName: string) => {
    setFamilyTrees(trees => trees.map(t => ({ ...t, active: t.id === treeId })));
    setSelectedTreeId(treeId);
    setSelectedTreeName(treeName);
    setYearFilter("all");
    setTypeFilter("all");
  };


  const handleCardSelect = (year: string, entry: AchievementEntry) => {
    setSelectedAchievement(entry);
    setSelectedAchievementYear(year);
    setIsEditingAchievement(false);
    setAchievementFormData({
      person: entry.person,
      category: entry.category,
      date: entry.rawDate || entry.date, // Use rawDate (YYYY-MM-DD) for edit form
      title: entry.title,
      description: entry.description,
    });
  };

  const handleModalClose = () => {
    setSelectedAchievement(null);
    setSelectedAchievementYear(null);
    setIsEditingAchievement(false);
    setIsDeleteConfirmOpen(false);
    setAchievementFormData(null);
  };

  // Life Event handlers
  const handleLifeEventCardSelect = (year: string, entry: LifeEventEntry) => {
    setSelectedLifeEvent(entry);
    setSelectedLifeEventYear(year);
    setIsEditingLifeEvent(false);
    setLifeEventFormData({
      member1: entry.member1,
      member2: entry.member2,
      date: entry.rawDate || entry.date, // Use rawDate (YYYY-MM-DD) for edit form
    });
  };

  const handleLifeEventModalClose = () => {
    setSelectedLifeEvent(null);
    setSelectedLifeEventYear(null);
    setIsEditingLifeEvent(false);
    setLifeEventFormData(null);
  };

  const handleLifeEventEditClick = () => {
    setIsEditingLifeEvent(true);
  };

  const handleLifeEventEditCancel = () => {
    setIsEditingLifeEvent(false);
    // Reset form data to original values
    if (selectedLifeEvent) {
      setLifeEventFormData({
        member1: selectedLifeEvent.member1,
        member2: selectedLifeEvent.member2,
        date: selectedLifeEvent.date,
      });
    }
  };

  const handleLifeEventFormChange = (field: "member1" | "member2" | "date") => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value;
    setLifeEventFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleLifeEventSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLifeEvent || !selectedLifeEventYear || !lifeEventFormData) return;

    try {
      const response = await fetch("/api/life-events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationshipId: selectedLifeEvent.relationshipId,
          eventType: selectedLifeEvent.eventType,
          date: lifeEventFormData.date,
          member1: lifeEventFormData.member1,
          member2: lifeEventFormData.member2,
        }),
      });

      if (response.ok) {
        // Refresh life events data from database
        fetchLifeEvents();
        handleLifeEventModalClose();
      } else {
        console.error("Failed to update life event");
      }
    } catch (error) {
      console.error("Error updating life event:", error);
    }
  };

  // Passing handlers
  const handlePassingCardSelect = (year: string, entry: PassingEntry) => {
    setSelectedPassing(entry);
    setSelectedPassingYear(year);
    setIsEditingPassing(false);
    setPassingFormData({
      person: entry.person,
      date: entry.date,
      causes: [...entry.causes],
      burialPlaces: entry.burialPlaces.map(p => ({ ...p })),
    });
  };

  const handlePassingModalClose = () => {
    setSelectedPassing(null);
    setSelectedPassingYear(null);
    setIsEditingPassing(false);
    setPassingFormData(null);
  };

  const handlePassingEditClick = () => {
    setIsEditingPassing(true);
  };

  const handlePassingEditCancel = () => {
    setIsEditingPassing(false);
    // Reset form data to original values
    if (selectedPassing) {
      setPassingFormData({
        person: selectedPassing.person,
        date: selectedPassing.date,
        causes: [...selectedPassing.causes],
        burialPlaces: selectedPassing.burialPlaces.map(p => ({ ...p })),
      });
    }
  };

  const handlePassingFormChange = (field: "person" | "date") => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value;
    setPassingFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handlePassingCauseChange = (index: number) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value;
    setPassingFormData((prev) => {
      if (!prev) return prev;
      const newCauses = [...prev.causes];
      newCauses[index] = value;
      return { ...prev, causes: newCauses };
    });
  };

  const handleDeleteCause = (index: number) => {
    setPassingFormData((prev) => {
      if (!prev) return prev;
      const newCauses = prev.causes.filter((_, i) => i !== index);
      return { ...prev, causes: newCauses };
    });
  };

  const handlePassingBurialPlaceChange = (index: number, field: "location" | "startDate") => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value;
    setPassingFormData((prev) => {
      if (!prev) return prev;
      const newBurialPlaces = [...prev.burialPlaces];
      newBurialPlaces[index] = { ...newBurialPlaces[index], [field]: value };
      return { ...prev, burialPlaces: newBurialPlaces };
    });
  };

  const handleDeleteBurialPlace = (index: number) => {
    setPassingFormData((prev) => {
      if (!prev) return prev;
      const newBurialPlaces = prev.burialPlaces.filter((_, i) => i !== index);
      return { ...prev, burialPlaces: newBurialPlaces };
    });
  };

  const handlePassingSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPassing || !selectedPassingYear || !passingFormData) return;

    // Create updated passing entry
    const updatedPassing = {
      ...selectedPassing,
      person: passingFormData.person,
      date: passingFormData.date,
      causes: passingFormData.causes,
      burialPlaces: passingFormData.burialPlaces,
      // Update the cause string for display
      cause: `Causes: ${passingFormData.causes.join(", ")}`,
    };

    // Update the passing sections state
    setPassingSectionsState((prev) =>
      prev.map((section) =>
        section.year === selectedPassingYear
          ? {
            ...section,
            entries: section.entries.map((entry) =>
              entry.id === selectedPassing.id ? updatedPassing : entry
            ),
          }
          : section
      )
    );

    // Update selected passing and close modal
    setSelectedPassing(updatedPassing);
    handlePassingModalClose();
  };

  const handleEditClick = () => {
    setIsEditingAchievement(true);
  };

  const handleEditCancel = () => {
    setIsEditingAchievement(false);
  };

  const handleFormChange = (field: keyof AchievementFormData) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value;
    setAchievementFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAchievement || !selectedAchievementYear) {
      setIsDeleteConfirmOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/achievements?id=${selectedAchievement.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh achievements data from database
        fetchAchievements();
        handleModalClose();
      } else {
        console.error("Failed to delete achievement");
      }
    } catch (error) {
      console.error("Error deleting achievement:", error);
    }
  };

  const handleModalSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAchievement || !selectedAchievementYear || !achievementFormData) return;

    try {
      const response = await fetch("/api/achievements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAchievement.id,
          title: achievementFormData.title,
          date: achievementFormData.date,
          description: achievementFormData.description,
          category: achievementFormData.category,
        }),
      });

      if (response.ok) {
        // Refresh achievements data from database
        fetchAchievements();
        handleModalClose();
      } else {
        console.error("Failed to update achievement");
      }
    } catch (error) {
      console.error("Error updating achievement:", error);
    }
  };

  // Add Achievement handlers
  const handleAddAchievementClose = () => {
    setIsAddAchievementOpen(false);
    setNewAchievementFormData({
      person: "",
      category: "",
      date: "",
      title: "",
      description: "",
    });
  };

  const handleNewAchievementFormChange = (field: keyof typeof newAchievementFormData) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value;
    setNewAchievementFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAchievementSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newAchievementFormData.person || !newAchievementFormData.category || !newAchievementFormData.date) {
      return;
    }

    if (!selectedTreeId) return;

    setIsSaving(true);

    try {
      // Find the member ID from the selected member name
      const selectedMember = availableMembers.find(m => m.name === newAchievementFormData.person);
      // Find the achievement type ID from the selected type name
      const selectedType = availableTypes.find(t => t.name === newAchievementFormData.category);

      if (!selectedMember || !selectedType) {
        console.error("Member or type not found");
        setIsSaving(false);
        return;
      }

      // Native date input already returns YYYY-MM-DD format
      const dbDate = newAchievementFormData.date;

      const response = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeId: selectedTreeId,
          memberId: selectedMember.id,
          achievementTypeId: selectedType.id,
          date: dbDate,
          title: newAchievementFormData.title || "New Achievement",
          description: newAchievementFormData.description || "",
        }),
      });

      if (response.ok) {
        // Refresh achievements data
        fetchAchievements();
        handleAddAchievementClose();
      } else {
        console.error("Failed to save achievement");
      }
    } catch (error) {
      console.error("Error saving achievement:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addButtonLabel = useMemo(() => {
    if (activeTab === "Passing") return "Add Passing";
    if (activeTab === "Life Event") return "Add Divorce";
    return "Add Achievement";
  }, [activeTab]);

  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] text-gray-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <FamilySidebar
          brand={{
            title: "Family Tree",
            logo: <FamilyTreeLogo className="h-7 w-7" />,
          }}
          trees={familyTrees}
          navItems={sidebarNavItems}
          footerUser={{
            name: "Forrest",
            role: "Owner",
            avatarSrc: "/images/forrest-avatar.svg",
            arrowSrc: "/sidebar-icons/logout-arrow.png",
          }}
        />

        <main className="box-border flex-1 bg-white px-6 pb-16 pt-10 overflow-x-hidden" style={{ minHeight: "1024px" }}>
          <header className="border-b border-gray-200 pb-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">{selectedTreeName}</h1>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="flex w-full max-w-[900px] overflow-hidden rounded-full border border-[#B9BEC7] bg-[#E7E8EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                {achievementTabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 items-center justify-center py-3 text-base font-semibold transition ${activeTab === tab.id
                      ? "bg-[#E1E3E9] text-[#111322]"
                      : "text-[#4C5364]"
                      } ${index === 0
                        ? "pl-6"
                        : index === achievementTabs.length - 1
                          ? "pr-6"
                          : "px-6"
                      } ${index !== 0 ? "border-l border-[#C4C7D0]" : ""
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 mx-auto flex w-full max-w-[900px] flex-wrap items-center gap-4">
              {/* Year Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setIsYearDropdownOpen(!isYearDropdownOpen); setIsTypeDropdownOpen(false); }}
                  className={`flex h-9 w-[150px] items-center justify-center gap-2 rounded-[999px] border ${yearFilter !== "all" ? "border-[#0064FF] bg-blue-50" : "border-[#C9CDD4] bg-white"} text-sm font-medium text-gray-700`}
                >
                  <CalendarDays className={`h-4 w-4 ${yearFilter !== "all" ? "text-[#0064FF]" : "text-gray-500"}`} />
                  {yearFilter === "all" ? "All Years" : yearFilter}
                </button>
                {isYearDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-[150px] rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    <button
                      onClick={() => { setYearFilter("all"); setIsYearDropdownOpen(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${yearFilter === "all" ? "font-semibold text-[#0064FF]" : ""}`}
                    >
                      All Years
                    </button>
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => { setYearFilter(year); setIsYearDropdownOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${yearFilter === year ? "font-semibold text-[#0064FF]" : ""}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type Filter Dropdown (only for Achievement tab) */}
              {!isPassingView && !isLifeEventView && (
                <div className="relative">
                  <button
                    onClick={() => { setIsTypeDropdownOpen(!isTypeDropdownOpen); setIsYearDropdownOpen(false); }}
                    className={`flex h-9 w-[150px] items-center justify-center gap-2 rounded-[999px] border ${typeFilter !== "all" ? "border-[#0064FF] bg-blue-50" : "border-[#C9CDD4] bg-white"} text-sm font-medium text-gray-700`}
                  >
                    <ListChecks className={`h-4 w-4 ${typeFilter !== "all" ? "text-[#0064FF]" : "text-gray-500"}`} />
                    {typeFilter === "all" ? "All Types" : typeFilter}
                  </button>
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg z-50 max-h-[300px] overflow-y-auto">
                      <button
                        onClick={() => { setTypeFilter("all"); setIsTypeDropdownOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${typeFilter === "all" ? "font-semibold text-[#0064FF]" : ""}`}
                      >
                        All Types
                      </button>
                      {availableTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => { setTypeFilter(type.name); setIsTypeDropdownOpen(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${typeFilter === type.name ? "font-semibold text-[#0064FF]" : ""}`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setIsAddAchievementOpen(true)}
                className="ml-auto flex h-9 w-[150px] items-center justify-center gap-2 rounded-[999px] border border-[#101828] text-sm font-semibold text-gray-900"
              >
                <Plus className="h-4 w-4" />
                {addButtonLabel}
              </button>
            </div>
          </header>

          <section className="mt-10 space-y-12">
            {isPassingView
              ? passingSectionsState.map(({ year, entries }) => (
                <div key={year}>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex items-center gap-3 rounded-full border border-[#BEBEBE] bg-white px-5 py-2 text-base font-semibold text-[#0E1A2A]">
                      <CalendarDays className="h-5 w-5 text-[#0E1A2A]" />
                      {year}
                    </div>
                    <div className="h-px flex-1 bg-[#D9CDA6]" />
                  </div>

                  <div className="mx-auto flex max-w-[900px] flex-col gap-[24px]">
                    {entries.map((entry) => {
                      return (
                        <article
                          key={entry.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`View passing information: ${entry.title}`}
                          onClick={() => handlePassingCardSelect(year, entry)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handlePassingCardSelect(year, entry);
                            }
                          }}
                          className="flex min-h-[152px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border border-[#B4B4B4] bg-[#D9D9D9] px-6 py-5 text-[#1A1A1A] shadow-[0_6px_12px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#101828]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <h2 className="truncate text-lg font-semibold">{entry.title}</h2>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#3C3C3C]">
                                <span className="flex items-center gap-2">
                                  <PersonIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{entry.person}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                  {entry.date}
                                </span>
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{entry.location}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                              <Image
                                src={entry.iconPath}
                                alt="Passing"
                                width={28}
                                height={28}
                                className="object-contain"
                              />
                            </div>
                          </div>
                          <p className="line-clamp-1 text-sm text-[#2E2E2E]">{entry.cause}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))
              : isLifeEventView
                ? lifeEventSectionsState.map(({ year, entries }) => (
                  <div key={year}>
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex items-center gap-3 rounded-full border border-[#C7CBD4] bg-white px-5 py-2 text-base font-semibold text-[#0E1A2A]">
                        <CalendarDays className="h-5 w-5 text-[#0E1A2A]" />
                        {year}
                      </div>
                      <div className="h-px flex-1 bg-[#DAD5C5]" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {entries.map((entry) => (
                        <article
                          key={entry.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`View ${entry.eventType === "marriage" ? "marriage" : "divorce"} event: ${entry.title}`}
                          onClick={() => handleLifeEventCardSelect(year, entry)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleLifeEventCardSelect(year, entry);
                            }
                          }}
                          className="flex min-h-[152px] cursor-pointer flex-col justify-between overflow-hidden rounded-[30px] border border-black/25 bg-white px-6 py-5 text-[#231F20] shadow-[0_6px_12px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#101828]"
                          style={{ backgroundColor: entry.background }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <h2 className="truncate text-lg font-semibold">{entry.title}</h2>
                              <div className="mt-2 flex items-center gap-2 text-sm text-[#4E4444]">
                                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                {entry.date}
                              </div>
                            </div>
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-black/20 bg-white">
                              <Image src={entry.iconSrc} alt="Event icon" width={28} height={28} />
                            </div>
                          </div>
                          <p className="line-clamp-2 text-sm text-[#3B2E2E]">{entry.description}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                ))
                : achievementSections.map(({ year, entries }) => (
                  <div key={year}>
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex items-center gap-3 rounded-3xl border border-gray-900 px-4 py-2 text-base font-semibold">
                        <CalendarDays className="h-5 w-5 text-gray-700" />
                        {year}
                      </div>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {entries.map((entry) => {
                        return (
                          <article
                            key={entry.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Edit achievement ${entry.title}`}
                            onClick={() => handleCardSelect(year, entry)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleCardSelect(year, entry);
                              }
                            }}
                            className="flex min-h-[152px] cursor-pointer flex-col justify-between overflow-hidden rounded-[30px] border border-black/25 px-7 py-5 text-gray-900 shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#101828]"
                            style={{ backgroundColor: entry.background }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-700">
                                <div className="flex items-center gap-2 font-medium">
                                  <PersonIcon className="h-4 w-4" />
                                  {entry.person}
                                </div>
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  {entry.date}
                                </div>
                              </div>
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                                <Image
                                  src={entry.iconPath}
                                  alt={entry.category}
                                  width={28}
                                  height={28}
                                  className="object-contain"
                                />
                              </div>
                            </div>
                            <div className="min-w-0 overflow-hidden">
                              <h2 className="truncate font-serif text-[22px] font-semibold leading-tight text-gray-900">
                                {entry.title}
                              </h2>
                              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-700">
                                {entry.description}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
          </section>
        </main>

        {selectedAchievement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={handleModalClose}
          >
            <div
              className="relative flex w-full max-w-[600px] flex-col rounded-[40px] border border-black/20 bg-white p-[30px] text-[#111] shadow-[0_25px_80px_rgba(0,0,0,0.25)] md:h-[736px]"
              style={{ maxHeight: "90vh" }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={isEditingAchievement ? handleEditCancel : handleModalClose}
                className="flex items-center gap-2 text-base font-medium text-[#111]"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[16px] border border-black/15 bg-[#F4F4F4]">
                  <Image src="/icons/cup.png" alt="Achievement icon" width={28} height={28} />
                </div>
                <h2 className="text-center text-[26px] font-normal leading-tight text-[#000]">
                  {isEditingAchievement
                    ? "Achievement Editing"
                    : `${selectedAchievement.person}'s Achievement`}
                </h2>
              </div>

              {isEditingAchievement ? (
                <form
                  key={selectedAchievement.id}
                  onSubmit={handleModalSave}
                  className="mt-6 flex flex-col items-center gap-5 overflow-y-auto"
                  style={{ maxHeight: "calc(90vh - 180px)" }}
                >
                  <div className="w-full max-w-[461px] space-y-2">
                    <label className="text-sm font-medium text-[#111]">Family Member *</label>
                    <input
                      className="h-[35px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={achievementFormData?.person ?? ""}
                      onChange={handleFormChange("person")}
                    />
                  </div>

                  <div className="flex w-full max-w-[461px] flex-col gap-4 md:flex-row">
                    {/* Achievement Type Dropdown */}
                    <div className="flex flex-1 flex-col space-y-2">
                      <label className="text-sm font-medium text-[#111]">Achievement Type *</label>
                      <select
                        className="h-[35px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] md:max-w-[205px] appearance-none cursor-pointer"
                        value={achievementFormData?.category ?? ""}
                        onChange={handleFormChange("category")}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                      >
                        <option value="">Select type</option>
                        {availableTypes.map((type) => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Date Picker with Calendar Icon */}
                    <div className="flex flex-1 flex-col space-y-2">
                      <label className="text-sm font-medium text-[#111]">Date Achieved *</label>
                      <div className="relative md:max-w-[205px]">
                        <input
                          type="date"
                          className="h-[35px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 pr-10 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          value={achievementFormData?.date ?? ""}
                          onChange={(e) => setAchievementFormData(prev => prev ? { ...prev, date: e.target.value } : null)}
                        />
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-[461px] space-y-2">
                    <label className="text-sm font-medium text-[#111]">Achievement Title (optional)</label>
                    <input
                      className="h-[35px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={achievementFormData?.title ?? ""}
                      onChange={handleFormChange("title")}
                    />
                  </div>

                  <div className="w-full max-w-[461px] space-y-2">
                    <label className="text-sm font-medium text-[#111]">Description (optional)</label>
                    <textarea
                      className="h-[115px] w-full resize-none rounded-[24px] border border-[#B6B6B6] bg-[#F6F6F6] p-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={achievementFormData?.description ?? ""}
                      onChange={handleFormChange("description")}
                    />
                  </div>

                  <div className="mt-6 flex w-full max-w-[461px] flex-wrap items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="h-10 w-[95px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 w-[123px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className="mt-6 flex flex-col items-center gap-5 overflow-y-auto"
                  style={{ maxHeight: "calc(90vh - 180px)" }}
                >
                  <div className="w-full max-w-[461px] space-y-2">
                    <label className="text-sm font-medium text-[#111]">Family Member *</label>
                    <input
                      className="h-[35px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                      value={selectedAchievement.person}
                      readOnly
                    />
                  </div>

                  <div className="flex w-full max-w-[461px] flex-col gap-4 md:flex-row">
                    <div className="flex flex-1 flex-col space-y-2">
                      <label className="text-sm font-medium text-[#111]">Achievement Type *</label>
                      <input
                        className="h-[35px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] md:max-w-[205px]"
                        value={selectedAchievement.category}
                        readOnly
                      />
                    </div>
                    <div className="flex flex-1 flex-col space-y-2">
                      <label className="text-sm font-medium text-[#111]">Date Achieved *</label>
                      <input
                        className="h-[35px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] md:max-w-[205px]"
                        value={selectedAchievement.date}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="w-full max-w-[461px] space-y-2">
                    <label className="text-sm font-medium text-[#111]">Achievement Title</label>
                    <input
                      className="h-[35px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                      value={selectedAchievement.title}
                      readOnly
                    />
                  </div>

                  <div className="w-full max-w-[461px] space-y-2">
                    <label className="text-sm font-medium text-[#111]">Description</label>
                    <textarea
                      className="h-[115px] w-full cursor-default resize-none rounded-[24px] border border-[#B6B6B6] bg-[#F6F6F6] p-4 text-sm text-[#111]"
                      value={selectedAchievement.description}
                      readOnly
                    />
                  </div>

                  <div className="mt-6 flex w-full max-w-[461px] flex-wrap items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="h-10 w-[95px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="h-10 w-[123px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {isDeleteConfirmOpen && selectedAchievement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={handleDeleteCancel}
          >
            <div
              className="relative w-full max-w-[520px] rounded-[32px] border border-black/10 bg-white p-8 text-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="flex items-center gap-2 text-base font-medium text-[#111]"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
              <div className="mt-5 space-y-4">
                <h3 className="text-xl font-semibold">Delete Achievement</h3>
                <p className="text-sm text-[#4E4E4E]">This action cannot be undone.</p>
                <p className="text-sm text-[#4E4E4E]">
                  Are you sure you want to delete the achievement of {selectedAchievement.person}?
                </p>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="h-10 w-[95px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="h-10 w-[123px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Life Event Modal */}
        {selectedLifeEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={handleLifeEventModalClose}
          >
            <div
              className="relative flex w-full max-w-[500px] flex-col rounded-[32px] border border-black/10 bg-white p-8 text-[#111] shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={isEditingLifeEvent ? handleLifeEventEditCancel : handleLifeEventModalClose}
                className="flex items-center gap-2 text-base font-medium text-[#111]"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Image
                  src={selectedLifeEvent.iconSrc}
                  alt={selectedLifeEvent.eventType === "marriage" ? "Marriage icon" : "Divorce icon"}
                  width={48}
                  height={48}
                />
                <h2 className="text-center text-[24px] font-normal leading-tight text-[#000]">
                  {isEditingLifeEvent
                    ? selectedLifeEvent.eventType === "marriage"
                      ? "Edit Marriage Information"
                      : "Edit Divorce Information"
                    : selectedLifeEvent.eventType === "marriage"
                      ? "Marriage Information"
                      : "Divorce Information"}
                </h2>
              </div>

              {isEditingLifeEvent ? (
                <form onSubmit={handleLifeEventSave} className="mt-8 flex flex-col gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Member 1 *</label>
                    <input
                      className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={lifeEventFormData?.member1 ?? ""}
                      onChange={handleLifeEventFormChange("member1")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Member 2 *</label>
                    <input
                      className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={lifeEventFormData?.member2 ?? ""}
                      onChange={handleLifeEventFormChange("member2")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">
                      {selectedLifeEvent.eventType === "marriage" ? "Date of Marriage *" : "Date of Divorce *"}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 pr-12 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={lifeEventFormData?.date ?? ""}
                        onChange={(e) => setLifeEventFormData(prev => prev ? { ...prev, date: e.target.value } : null)}
                      />
                      <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleLifeEventEditCancel}
                      className="h-10 w-[100px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 w-[100px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mt-8 flex flex-col gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">Member 1 *</label>
                      <input
                        className="h-[40px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                        value={selectedLifeEvent.member1}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">Member 2 *</label>
                      <input
                        className="h-[40px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                        value={selectedLifeEvent.member2}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">
                        {selectedLifeEvent.eventType === "marriage" ? "Date of Marriage *" : "Date of Divorce *"}
                      </label>
                      <input
                        className="h-[40px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                        value={selectedLifeEvent.date}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleLifeEventModalClose}
                      className="h-10 w-[100px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleLifeEventEditClick}
                      className="h-10 w-[100px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                    >
                      Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Passing Modal */}
        {selectedPassing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={handlePassingModalClose}
          >
            <div
              className="relative flex w-full max-w-[520px] flex-col rounded-[32px] border border-black/10 bg-white p-8 text-[#111] shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
              style={{ maxHeight: "90vh" }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={isEditingPassing ? handlePassingEditCancel : handlePassingModalClose}
                className="flex items-center gap-2 text-base font-medium text-[#111]"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[16px] border border-black/15 bg-[#F4F4F4]">
                  <Image src="/icons/passing.png" alt="Passing" width={24} height={24} />
                </div>
                <h2 className="text-center text-[22px] font-normal leading-tight text-[#000]">
                  {isEditingPassing ? "Edit Passing Information" : `${selectedPassing.person}'s Passing Information`}
                </h2>
              </div>

              {isEditingPassing ? (
                <form onSubmit={handlePassingSave} className="mt-6 flex flex-col gap-5 overflow-y-auto pr-2" style={{ maxHeight: "calc(90vh - 280px)" }}>
                  {/* Family Member */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Family Member *</label>
                    <input
                      className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={passingFormData?.person ?? ""}
                      onChange={handlePassingFormChange("person")}
                    />
                  </div>

                  {/* Date of Passing */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Date Of Passing *</label>
                    <input
                      className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={passingFormData?.date ?? ""}
                      onChange={handlePassingFormChange("date")}
                    />
                  </div>

                  {/* Cause of Passing */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Cause Of Passing *</label>
                    <div className="flex flex-col gap-2">
                      {passingFormData?.causes.map((cause, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            className="h-[40px] flex-1 rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                            value={cause}
                            onChange={handlePassingCauseChange(index)}
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCause(index)}
                              className="flex h-8 w-8 items-center justify-center"
                            >
                              <Image src="/icons/thung_rac.png" alt="Delete" width={20} height={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Burial Places */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Burial Places *</label>
                    <div className="flex flex-col gap-4">
                      {passingFormData?.burialPlaces.map((place, index) => (
                        <div
                          key={index}
                          className="relative rounded-[16px] border border-[#A5C9E8] bg-[#E8F4FD] p-4"
                        >
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBurialPlace(index)}
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center"
                            >
                              <Image src="/icons/thung_rac.png" alt="Delete" width={16} height={16} />
                            </button>
                          )}
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#555]">Location *</label>
                              <input
                                className="h-[36px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                                value={place.location}
                                onChange={handlePassingBurialPlaceChange(index, "location")}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#555]">Start Date *</label>
                              <input
                                className="h-[36px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                                value={place.startDate}
                                onChange={handlePassingBurialPlaceChange(index, "startDate")}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handlePassingEditCancel}
                      className="h-10 w-[100px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 w-[100px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div
                    className="mt-6 flex flex-col gap-5 overflow-y-auto pr-2"
                    style={{ maxHeight: "calc(90vh - 280px)" }}
                  >
                    {/* Family Member */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">Family Member *</label>
                      <input
                        className="h-[40px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                        value={selectedPassing.person}
                        readOnly
                      />
                    </div>

                    {/* Date of Passing */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">Date Of Passing *</label>
                      <input
                        className="h-[40px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                        value={selectedPassing.date}
                        readOnly
                      />
                    </div>

                    {/* Cause of Passing */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">Cause Of Passing *</label>
                      <div className="flex flex-col gap-2">
                        {selectedPassing.causes.map((cause, index) => (
                          <input
                            key={index}
                            className="h-[40px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                            value={cause}
                            readOnly
                          />
                        ))}
                      </div>
                    </div>

                    {/* Burial Places */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111]">Burial Places *</label>
                      <div className="flex flex-col gap-4">
                        {selectedPassing.burialPlaces.map((place, index) => (
                          <div
                            key={index}
                            className="rounded-[16px] border border-[#A5C9E8] bg-[#E8F4FD] p-4"
                          >
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-[#555]">Location *</label>
                                <input
                                  className="h-[36px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                                  value={place.location}
                                  readOnly
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-[#555]">Start Date *</label>
                                <input
                                  className="h-[36px] w-full cursor-default rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111]"
                                  value={place.startDate}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handlePassingModalClose}
                      className="h-10 w-[100px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePassingEditClick}
                      className="h-10 w-[100px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                    >
                      Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Add Achievement Modal */}
        {isAddAchievementOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={handleAddAchievementClose}
          >
            <div
              className="relative flex w-full max-w-[520px] flex-col rounded-[32px] border border-black/10 bg-white p-8 text-[#111] shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
              style={{ maxHeight: "90vh" }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleAddAchievementClose}
                className="flex items-center gap-2 text-base font-medium text-[#111]"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[16px] border border-black/15 bg-[#F4F4F4]">
                  <Image src="/icons/cup.png" alt="Achievement" width={24} height={24} />
                </div>
                <h2 className="text-center text-[22px] font-normal leading-tight text-[#000]">
                  Record Achievement
                </h2>
              </div>

              <form onSubmit={handleAddAchievementSave} className="mt-6 flex flex-col gap-5 overflow-y-auto pr-2" style={{ maxHeight: "calc(90vh - 280px)" }}>
                {/* Family Member - Dynamic from API */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111]">Family Member *</label>
                  <select
                    className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] appearance-none cursor-pointer"
                    value={newAchievementFormData.person}
                    onChange={handleNewAchievementFormChange("person")}
                    required
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                  >
                    <option value="">Select member</option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>

                {/* Achievement Type and Date Achieved */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Achievement Type - Dynamic from API */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Achievement Type *</label>
                    <select
                      className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] appearance-none cursor-pointer"
                      value={newAchievementFormData.category}
                      onChange={handleNewAchievementFormChange("category")}
                      required
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                    >
                      <option value="">Select type</option>
                      {availableTypes.map((type) => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Date with Calendar Icon */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111]">Date Achieved *</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 pr-12 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={newAchievementFormData.date}
                        onChange={(e) => setNewAchievementFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                      <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Achievement Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111]">
                    Achievement Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bachelor of Computer Science"
                    className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                    value={newAchievementFormData.title}
                    onChange={handleNewAchievementFormChange("title")}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111]">
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    placeholder="Describe the achievement"
                    className="min-h-[100px] w-full rounded-[16px] border border-[#B6B6B6] bg-[#F6F6F6] px-4 py-3 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                    value={newAchievementFormData.description}
                    onChange={handleNewAchievementFormChange("description")}
                  />
                </div>

                <div className="mt-4 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleAddAchievementClose}
                    className="h-10 w-[100px] rounded-[20px] border border-[#111] text-sm font-semibold text-[#111]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 w-[100px] rounded-[20px] bg-[#111827] text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
