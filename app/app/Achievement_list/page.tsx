"use client";

import Image from "next/image";
import { type ChangeEvent, type ComponentType, type FormEvent, useMemo, useState } from "react";

import {
  Award,
  BookOpenCheck,
  ChevronLeft,
  CalendarDays,
  LayoutDashboard,
  Leaf,
  LineChart,
  ListChecks,
  MapPin,
  Plus,
  Settings,
  Trees,
  Trophy,
  UsersRound,
} from "lucide-react";

import { FamilySidebar } from "../../components/family-sidebar";
import { FamilyTreeLogo } from "../../components/icons/family-tree-logo";
import { PersonIcon, CalendarIcon } from "../../components/icons/achievement-metadata";
import { GraduationIcon } from "../../components/icons/graduation-icon";

type AchievementIcon = ComponentType<{ className?: string }>;

interface AchievementEntry {
  id: string;
  category: string;
  title: string;
  person: string;
  date: string;
  description: string;
  background: string;
  icon: AchievementIcon;
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
  icon: AchievementIcon;
}

interface LifeEventEntry {
  id: string;
  year: string;
  title: string;
  date: string;
  description: string;
  background: string;
  iconSrc: string;
  eventType: "marriage" | "divorce";
  member1: string;
  member2: string;
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
        icon: GraduationIcon,
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
        icon: UsersRound,
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
        icon: Trophy,
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
        icon: ListChecks,
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
        icon: Leaf,
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
        icon: BookOpenCheck,
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
        icon: Leaf,
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
        icon: Leaf,
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

const familyTrees = [
  { id: "hunter", name: "Hunter Family", href: "#", active: true },
  { id: "frank", name: "Frank Family", href: "#" },
];

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

  const handleCardSelect = (year: string, entry: AchievementEntry) => {
    setSelectedAchievement(entry);
    setSelectedAchievementYear(year);
    setIsEditingAchievement(false);
    setAchievementFormData({
      person: entry.person,
      category: entry.category,
      date: entry.date,
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
      date: entry.date,
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

  const handleLifeEventSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLifeEvent || !selectedLifeEventYear || !lifeEventFormData) return;

    // Update the life event sections state
    setLifeEventSectionsState((prev) =>
      prev.map((section) =>
        section.year === selectedLifeEventYear
          ? {
            ...section,
            entries: section.entries.map((entry) =>
              entry.id === selectedLifeEvent.id
                ? { ...entry, ...lifeEventFormData }
                : entry
            ),
          }
          : section
      )
    );

    // Update the selected life event and close modal
    setSelectedLifeEvent({ ...selectedLifeEvent, ...lifeEventFormData });
    handleLifeEventModalClose();
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

  const handleDeleteConfirm = () => {
    if (!selectedAchievement || !selectedAchievementYear) {
      setIsDeleteConfirmOpen(false);
      return;
    }

    setAchievementSections((prev) =>
      prev
        .map((section) =>
          section.year === selectedAchievementYear
            ? {
              ...section,
              entries: section.entries.filter((entry) => entry.id !== selectedAchievement.id),
            }
            : section
        )
        .filter((section) => section.entries.length > 0)
    );

    handleModalClose();
  };

  const handleModalSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAchievement || !selectedAchievementYear || !achievementFormData) return;

    setAchievementSections((prev) =>
      prev.map((section) =>
        section.year === selectedAchievementYear
          ? {
            ...section,
            entries: section.entries.map((entry) =>
              entry.id === selectedAchievement.id ? { ...entry, ...achievementFormData } : entry
            ),
          }
          : section
      )
    );

    setSelectedAchievement({ ...selectedAchievement, ...achievementFormData });
    handleModalClose();
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

        <main className="box-border w-[1232px] max-w-[1232px] flex-1 bg-white px-10 pb-16 pt-10" style={{ minHeight: "1024px" }}>
          <header className="border-b border-gray-200 pb-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">Hunter Family</h1>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="flex w-full max-w-[1032px] overflow-hidden rounded-full border border-[#B9BEC7] bg-[#E7E8EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
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

            <div className="mt-6 mx-auto flex w-full max-w-[1032px] flex-wrap items-center gap-4">
              {isPassingView ? (
                <button className="flex h-10 w-[150px] items-center justify-center gap-2 rounded-[50px] border border-[#0064FF] bg-white px-4 text-sm font-semibold text-[#0E1A2A] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                  <CalendarDays className="h-4 w-4 text-[#0064FF]" />
                  All Years
                </button>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <button className="flex h-9 w-[150px] items-center justify-center gap-2 rounded-[999px] border border-[#C9CDD4] bg-white text-sm font-medium text-gray-700">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    All Years
                  </button>
                  <button className="flex h-9 w-[150px] items-center justify-center gap-2 rounded-[999px] border border-[#C9CDD4] bg-white text-sm font-medium text-gray-700">
                    <Award className="h-4 w-4 text-gray-500" />
                    All Types
                  </button>
                </div>
              )}
              <button className="ml-auto flex h-9 w-[150px] items-center justify-center gap-2 rounded-[999px] border border-[#101828] text-sm font-semibold text-gray-900">
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

                  <div className="mx-auto flex max-w-[1032px] flex-col gap-[30px]">
                    {entries.map((entry) => {
                      const Icon = entry.icon;
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
                          className="flex h-[152px] w-full cursor-pointer flex-col justify-between rounded-[24px] border border-[#B4B4B4] bg-[#D9D9D9] px-6 py-5 text-[#1A1A1A] shadow-[0_6px_12px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#101828]"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-lg font-semibold">{entry.title}</h2>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#3C3C3C]">
                                <span className="flex items-center gap-2">
                                  <PersonIcon className="h-4 w-4" />
                                  {entry.person}
                                </span>
                                <span className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  {entry.date}
                                </span>
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {entry.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#9B9B9B] bg-white text-[#1A1A1A]">
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <p className="text-sm text-[#2E2E2E]">{entry.cause}</p>
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

                    <div className="mx-auto flex flex-col gap-[30px] lg:grid lg:grid-cols-[repeat(2,554px)] lg:justify-between lg:gap-x-[44px] lg:gap-y-[30px]">
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
                          className="flex h-[152px] w-[554px] cursor-pointer flex-col justify-between rounded-[30px] border border-black/25 bg-white px-6 py-5 text-[#231F20] shadow-[0_6px_12px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#101828]"
                          style={{ backgroundColor: entry.background }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-semibold">{entry.title}</h2>
                              <div className="mt-2 flex items-center gap-2 text-sm text-[#4E4444]">
                                <CalendarIcon className="h-4 w-4" />
                                {entry.date}
                              </div>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/20 bg-white">
                              <Image src={entry.iconSrc} alt="Event icon" width={28} height={28} />
                            </div>
                          </div>
                          <p className="text-sm text-[#3B2E2E]">{entry.description}</p>
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

                    <div className="mx-auto flex flex-col gap-[30px] lg:grid lg:grid-cols-[repeat(2,554px)] lg:justify-between lg:gap-x-[44px] lg:gap-y-[30px]">
                      {entries.map((entry) => {
                        const Icon = entry.icon;
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
                            className="flex h-[152px] w-[554px] cursor-pointer flex-col justify-between rounded-[30px] border border-black/25 px-7 py-5 text-gray-900 shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#101828]"
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
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/20 bg-white text-gray-900">
                                <Icon className="h-5 w-5" />
                              </div>
                            </div>
                            <div>
                              <h2 className="font-serif text-[22px] font-semibold leading-tight text-gray-900">
                                {entry.title}
                              </h2>
                              <p className="mt-3 text-sm leading-relaxed text-gray-700">
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
                    <div className="flex flex-1 flex-col space-y-2">
                      <label className="text-sm font-medium text-[#111]">Achievement Type *</label>
                      <input
                        className="h-[35px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] md:max-w-[205px]"
                        value={achievementFormData?.category ?? ""}
                        onChange={handleFormChange("category")}
                      />
                    </div>
                    <div className="flex flex-1 flex-col space-y-2">
                      <label className="text-sm font-medium text-[#111]">Date Achieved *</label>
                      <input
                        className="h-[35px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A] md:max-w-[205px]"
                        value={achievementFormData?.date ?? ""}
                        onChange={handleFormChange("date")}
                      />
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
                    <input
                      className="h-[40px] w-full rounded-full border border-[#B6B6B6] bg-[#F6F6F6] px-4 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#0E1A2A]"
                      value={lifeEventFormData?.date ?? ""}
                      onChange={handleLifeEventFormChange("date")}
                    />
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
                  <Leaf className="h-6 w-6 text-[#111]" />
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
      </div>
    </div>
  );
}
