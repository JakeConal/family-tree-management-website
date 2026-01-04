'use client';

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Users, HeartHandshake, Trophy, Network } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

import LoadingScreen from '@/components/LoadingScreen';
import { addFonts } from '@/fonts';
import { FamilyTreeService, FamilyMemberService } from '@/lib/services';
import { FamilyTree } from '@/types/dashboard';
import { Achievement, SpouseRelationship } from '@/types/lifeEvents';
import { jsPDFWithAutoTable, FamilyMemberWithDetails, ChartData, AchievementCategory } from '@/types/reports';

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

export default function FamilyTreeReports() {
	const params = useParams();
	const familyTreeId = params.id as string;

	const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
	const [loading, setLoading] = useState(true);
	const [totalMembers, setTotalMembers] = useState(0);
	const [currentMembers, setCurrentMembers] = useState(0);
	const [totalAchievements, setTotalAchievements] = useState(0);
	const [generations, setGenerations] = useState(0);

	// Chart data
	const [memberChangesData, setMemberChangesData] = useState<ChartData | null>(null);
	const [totalMembersByYearData, setTotalMembersByYearData] = useState<ChartData | null>(null);
	const [totalAchievementsByYearData, setTotalAchievementsByYearData] = useState<ChartData | null>(null);
	const [achievementCategoriesData, setAchievementCategoriesData] = useState<AchievementCategory[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch family tree
				const tree = await FamilyTreeService.getById(familyTreeId);
				setFamilyTree(tree);

				// Fetch family members
				const members = await FamilyMemberService.getAll({ familyTreeId });

				const total = members.length;
				const living = members.filter(
					(m: FamilyMemberWithDetails) => !m.passingRecords || m.passingRecords.length === 0
				).length;
				const maxGen = Math.max(...members.map((m: FamilyMemberWithDetails) => m.generation || 1), 1);

				setTotalMembers(total);
				setCurrentMembers(living);
				setGenerations(maxGen);

				// Determine year range
				const currentYear = new Date().getFullYear();
				const startYear = tree?.establishYear || currentYear - 5;

				// Process member changes by year
				processMemberChangesByYear(members, startYear, currentYear);
				processTotalMembersByYear(members, startYear, currentYear);

				// Extract achievements from members
				const allAchievements = members.flatMap((member: FamilyMemberWithDetails) =>
					(member.achievements || []).map((achievement: Achievement) => ({
						...achievement,
						achievementDate: achievement.achieveDate,
						achievementType: achievement.achievementType,
					}))
				);

				setTotalAchievements(allAchievements.length);
				processAchievementsByYear(allAchievements, startYear, currentYear);
				processAchievementCategories(allAchievements);
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};

		if (familyTreeId) {
			fetchData();
		}
	}, [familyTreeId]);

	const processMemberChangesByYear = (members: FamilyMemberWithDetails[], startYear: number, endYear: number) => {
		const yearData: { [key: string]: { married: number; deceased: number; birth: number } } = {};

		// Initialize years from start to end
		for (let year = startYear; year <= endYear; year++) {
			yearData[year] = { married: 0, deceased: 0, birth: 0 };
		}

		// Count births
		members.forEach((member) => {
			if (member.birthday) {
				const birthYear = new Date(member.birthday).getFullYear();
				if (yearData[birthYear]) {
					yearData[birthYear].birth++;
				}
			}
		});

		// Count marriages (from spouseRelationships)
		members.forEach((member) => {
			if (member.spouseRelationships) {
				member.spouseRelationships.forEach((rel: SpouseRelationship) => {
					if (rel.relationshipEstablished) {
						const year = new Date(rel.relationshipEstablished).getFullYear();
						if (yearData[year]) {
							yearData[year].married++;
						}
					}
				});
			}
		});

		// Count deceased (from passingRecords)
		members.forEach((member) => {
			if (member.passingRecords && member.passingRecords.length > 0) {
				member.passingRecords.forEach((record) => {
					const year = new Date(record.passingDate || record.dateOfPassing).getFullYear();
					if (yearData[year]) {
						yearData[year].deceased++;
					}
				});
			}
		});

		// Filter out years with no events
		const labels = Object.keys(yearData).filter((year) => {
			const data = yearData[year];
			return data.birth > 0 || data.married > 0 || data.deceased > 0;
		});

		console.log('Filtered Labels:', labels);

		const marriedData = labels.map((year) => yearData[year].married);
		const deceasedData = labels.map((year) => yearData[year].deceased);
		const birthData = labels.map((year) => yearData[year].birth);

		setMemberChangesData({
			labels,
			datasets: [
				{
					label: 'Married',
					data: marriedData,
					backgroundColor: 'rgba(147, 197, 253, 0.8)',
					borderRadius: 4,
				},
				{
					label: 'Deceased',
					data: deceasedData,
					backgroundColor: 'rgba(252, 165, 165, 0.8)',
					borderRadius: 4,
				},
				{
					label: 'Birth',
					data: birthData,
					backgroundColor: 'rgba(134, 239, 172, 0.8)',
					borderRadius: 4,
				},
			],
		});
	};

	const processTotalMembersByYear = (members: FamilyMemberWithDetails[], startYear: number, endYear: number) => {
		const yearCounts: { [key: string]: number } = {};

		// Initialize years
		for (let year = startYear; year <= endYear; year++) {
			yearCounts[year] = 0;
		}

		// For each year, count members born before or in that year and still alive
		for (let year = startYear; year <= endYear; year++) {
			yearCounts[year] = members.filter((member) => {
				const birthYear = member.birthday ? new Date(member.birthday).getFullYear() : startYear;
				const deathYear =
					member.passingRecords && member.passingRecords.length > 0 && member.passingRecords[0].passingDate
						? new Date(member.passingRecords[0].passingDate).getFullYear()
						: null;

				return birthYear <= year && (!deathYear || deathYear > year);
			}).length;
		}

		const labels = Object.keys(yearCounts).sort();
		const data = labels.map((year) => yearCounts[year]);

		setTotalMembersByYearData({
			labels,
			datasets: [
				{
					label: 'Total Members',
					data,
					borderColor: '#00a6f4',
					backgroundColor: 'rgba(0, 166, 244, 0.1)',
					pointBackgroundColor: '#00a6f4',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 4,
					pointHoverRadius: 6,
					tension: 0.4,
					fill: true,
				},
			],
		});
	};

	const processAchievementsByYear = (achievements: Achievement[], startYear: number, endYear: number) => {
		const yearCounts: { [key: string]: number } = {};

		// Initialize years
		for (let year = startYear; year <= endYear; year++) {
			yearCounts[year] = 0;
		}

		// Count cumulative achievements by year
		for (let year = startYear; year <= endYear; year++) {
			yearCounts[year] = achievements.filter((achievement) => {
				const achieveValue = achievement.achieveDate;
				const achievementYear = achieveValue
					? new Date(achieveValue instanceof Date ? achieveValue : achieveValue).getFullYear()
					: endYear;
				return achievementYear <= year;
			}).length;
		}

		const labels = Object.keys(yearCounts).sort();
		const data = labels.map((year) => yearCounts[year]);

		setTotalAchievementsByYearData({
			labels,
			datasets: [
				{
					label: 'Total Achievements',
					data,
					borderColor: '#00bc7d',
					backgroundColor: 'rgba(0, 188, 125, 0.1)',
					pointBackgroundColor: '#00bc7d',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 4,
					pointHoverRadius: 6,
					tension: 0.4,
					fill: true,
				},
			],
		});
	};

	const processAchievementCategories = (achievements: Achievement[]) => {
		const categoryCounts: { [key: string]: number } = {};
		const categoryColors: { [key: string]: string } = {
			Graduations: '#e0f2fe',
			Career: '#f3e8ff',
			Sport: '#fef9c3',
			Health: '#ffe4e6',
			Artistic: '#bae6fd',
			Environment: '#ecfccb',
			Community: '#dbeafe',
			Finance: '#ffedd5',
			Skills: '#fae8ff',
			Travel: '#ccfbf1',
		};

		achievements.forEach((achievement) => {
			const category = achievement.achievementType?.typeName || 'Other';
			categoryCounts[category] = (categoryCounts[category] || 0) + 1;
		});

		const categories: AchievementCategory[] = Object.entries(categoryCounts).map(([name, count]) => ({
			name,
			count,
			color: categoryColors[name] || '#f3f4f6',
		}));

		setAchievementCategoriesData(categories);
	};

	const exportReport = (format: 'excel' | 'pdf') => {
		if (format === 'excel') {
			exportToExcel();
		} else {
			exportToPDF();
		}
	};

	const exportToExcel = () => {
		const wb = XLSX.utils.book_new();

		// Get year range
		const startYear = memberChangesData?.labels[0] || '';
		const endYear = memberChangesData?.labels[memberChangesData.labels.length - 1] || '';

		// Biểu mẫu 5.1 - Tăng Giảm Thành Viên (Member Changes)
		if (memberChangesData) {
			const memberChangesSheetData = [
				['BM5.1:', 'Tăng Giảm Thành Viên'],
				[],
				[`Từ năm: ${startYear}`, '', '', `Đến năm: ${endYear}`],
				[],
				['STT', 'Năm', 'Số Lượng Sinh', 'Số Lượng Kết Hôn', 'Số Lượng Mất'],
				...memberChangesData.labels.map((year: string, idx: number) => [
					idx + 1,
					year,
					memberChangesData.datasets[2].data[idx], // Birth
					memberChangesData.datasets[0].data[idx], // Married
					memberChangesData.datasets[1].data[idx], // Deceased
				]),
			];
			const memberChangesSheet = XLSX.utils.aoa_to_sheet(memberChangesSheetData);
			XLSX.utils.book_append_sheet(wb, memberChangesSheet, 'Tăng Giảm Thành Viên');
		}

		// Biểu mẫu 5.2 - Thành Tích Các Thành Viên (Member Achievements)
		if (achievementCategoriesData.length > 0) {
			const categoriesSheetData = [
				['BM5.2:', 'Thành Tích Các Thành Viên'],
				[],
				[`Từ năm: ${startYear}`, '', `Đến năm: ${endYear}`],
				[],
				['STT', 'Loại Thành Tích', 'Số Lượng'],
				...achievementCategoriesData.map((cat, idx) => [idx + 1, cat.name || cat.category, cat.count]),
			];
			const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesSheetData);
			XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Thành Tích');
		}

		// Save the file
		const fileName = `${familyTree?.familyName || 'FamilyTree'}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
		XLSX.writeFile(wb, fileName);
	};

	const exportToPDF = () => {
		const doc = new jsPDF() as jsPDFWithAutoTable;

		addFonts(doc);

		const pageWidth = doc.internal.pageSize.getWidth();
		let yPos = 20;

		// Get year range
		const startYear = memberChangesData?.labels[0] || '';
		const endYear = memberChangesData?.labels[memberChangesData.labels.length - 1] || '';

		// Biểu mẫu 5.1 - Tăng Giảm Thành Viên
		if (memberChangesData) {
			// Title
			doc.setFontSize(16);
			doc.setFont('helvetica', 'bold');
			doc.text('BM5.1:', 14, yPos);
			doc.text('Tăng Giảm Thành Viên', 50, yPos);
			yPos += 10;

			// Date range
			doc.setFontSize(11);
			doc.setFont('helvetica', 'normal');
			doc.text(`Từ năm: ${startYear}`, 14, yPos);
			doc.text(`Đến năm: ${endYear}`, pageWidth - 60, yPos);
			yPos += 10;

			// Table data
			const memberChangesTableData = memberChangesData.labels.map((year: string, idx: number) => [
				(idx + 1).toString(),
				year,
				memberChangesData.datasets[2].data[idx].toString(), // Birth
				memberChangesData.datasets[0].data[idx].toString(), // Married
				memberChangesData.datasets[1].data[idx].toString(), // Deceased
			]);

			autoTable(doc, {
				startY: yPos,
				head: [['STT', 'Năm', 'Số Lượng Sinh', 'Số Lượng Kết Hôn', 'Số Lượng Mất']],
				body: memberChangesTableData,
				theme: 'grid',
				headStyles: {
					fillColor: [0, 0, 0],
					textColor: [255, 255, 255],
					fontStyle: 'bold',
					halign: 'center',
				},
				bodyStyles: {
					halign: 'center',
				},
				columnStyles: {
					0: { cellWidth: 20 }, // STT
					1: { cellWidth: 30 }, // Năm
				},
				margin: { left: 14, right: 14 },
			});

			if (doc.lastAutoTable) {
				yPos = doc.lastAutoTable.finalY + 20;
			}
		}

		// Biểu mẫu 5.2 - Thành Tích Các Thành Viên
		if (achievementCategoriesData.length > 0) {
			// Add new page if needed
			if (yPos > 200) {
				doc.addPage();
				yPos = 20;
			}

			// Title
			doc.setFontSize(16);
			doc.setFont('helvetica', 'bold');
			doc.text('BM5.2:', 14, yPos);
			doc.text('Thành Tích Các Thành Viên', 50, yPos);
			yPos += 10;

			// Date range
			doc.setFontSize(11);
			doc.setFont('helvetica', 'normal');
			doc.text(`Từ năm: ${startYear}`, 14, yPos);
			doc.text(`Đến năm: ${endYear}`, pageWidth - 60, yPos);
			yPos += 10;

			// Table data
			const categoriesTableData = achievementCategoriesData.map((cat, idx) => [
				(idx + 1).toString(),
				cat.name || cat.category || '',
				cat.count.toString(),
			]);

			autoTable(doc, {
				startY: yPos,
				head: [['STT', 'Loại Thành Tích', 'Số Lượng']],
				body: categoriesTableData,
				theme: 'grid',
				headStyles: {
					fillColor: [0, 0, 0],
					textColor: [255, 255, 255],
					fontStyle: 'bold',
					halign: 'center',
				},
				bodyStyles: {
					halign: 'center',
				},
				columnStyles: {
					0: { cellWidth: 20 }, // STT
					2: { cellWidth: 40 }, // Số Lượng
				},
				margin: { left: 14, right: 14 },
			});
		}

		// Save the file
		const fileName = `${familyTree?.familyName || 'FamilyTree'}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
		doc.save(fileName);
	};

	if (loading) {
		return <LoadingScreen message="Loading reports..." />;
	}

	// Chart options
	const barChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: true,
				position: 'bottom' as const,
				labels: {
					usePointStyle: true,
					padding: 15,
				},
			},
			tooltip: {
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				padding: 12,
				titleFont: { size: 13 },
				bodyFont: { size: 12 },
			},
		},
		scales: {
			x: {
				grid: { display: false },
			},
			y: {
				beginAtZero: true,
				ticks: { stepSize: 1 },
				grid: { color: 'rgba(0, 0, 0, 0.05)' },
			},
		},
	};

	const lineChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				padding: 12,
			},
		},
		scales: {
			x: { grid: { display: false } },
			y: {
				beginAtZero: true,
				ticks: { stepSize: 3 },
				grid: { color: 'rgba(0, 0, 0, 0.05)' },
			},
		},
	};

	const doughnutChartOptions = {
		responsive: true,
		maintainAspectRatio: true,
		cutout: '70%',
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				padding: 12,
			},
		},
	};

	const doughnutData = {
		labels: achievementCategoriesData.map((cat) => cat.name),
		datasets: [
			{
				data: achievementCategoriesData.map((cat) => cat.count),
				backgroundColor: achievementCategoriesData.map((cat) => cat.color),
				borderWidth: 0,
			},
		],
	};

	return (
		<div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
			<div className="max-w-[1158px] mx-auto space-y-8 sm:space-y-12 lg:space-y-[74px]">
				{/* Export Buttons */}
				<div className="flex justify-end gap-3">
					<div className="border border-[rgba(0,0,0,0.5)] rounded-[25px] flex flex-wrap items-center gap-2 p-1">
						<button className="px-3 sm:px-4 py-2 text-sm sm:text-[16px] font-inter text-black whitespace-nowrap">
							Export Report
						</button>
						<button
							onClick={() => exportReport('excel')}
							className="px-4 sm:px-6 py-2 bg-[#f8f8f8] border border-[rgba(0,0,0,0.5)] rounded-[25px] text-sm sm:text-[16px] font-inter text-black hover:bg-gray-200 transition-colors whitespace-nowrap"
						>
							Excel
						</button>
						<button
							onClick={() => exportReport('pdf')}
							className="px-4 sm:px-6 py-2 bg-[#f8f8f8] border border-[rgba(0,0,0,0.5)] rounded-[25px] text-sm sm:text-[16px] font-inter text-black hover:bg-gray-200 transition-colors whitespace-nowrap"
						>
							PDF
						</button>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-[52px]">
					{/* Total Family Members */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
						<Users className="w-7 h-5 sm:w-9 sm:h-6 text-black mb-3 sm:mb-4" />
						<h3 className="font-inter font-bold text-sm sm:text-[16px] text-black mb-2">Total family members</h3>
						<p className="font-inter text-3xl sm:text-[40px] text-black">{totalMembers}</p>
					</div>

					{/* Current Family Members */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
						<HeartHandshake className="w-7 h-6 sm:w-9 sm:h-8 text-black mb-3 sm:mb-4" />
						<h3 className="font-inter font-bold text-sm sm:text-[16px] text-black mb-2">Current family members</h3>
						<p className="font-inter text-3xl sm:text-[40px] text-black">{currentMembers}</p>
					</div>

					{/* Achievements */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
						<Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-black mb-3 sm:mb-4" />
						<h3 className="font-inter font-bold text-sm sm:text-[16px] text-black mb-2">Achievements</h3>
						<p className="font-inter text-3xl sm:text-[40px] text-black">{totalAchievements}</p>
					</div>

					{/* Generations */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
						<Network className="w-7 h-6 sm:w-9 sm:h-8 text-black mb-3 sm:mb-4" />
						<h3 className="font-inter font-bold text-sm sm:text-[16px] text-black mb-2">Generations</h3>
						<p className="font-inter text-3xl sm:text-[40px] text-black">{generations}</p>
					</div>
				</div>

				{/* Changes in Family Members Chart */}
				<div className="bg-white border-2 border-[rgba(0,0,0,0.25)] rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center">
							<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<circle cx="10" cy="10" r="10" />
							</svg>
						</div>
						<h3 className="font-poppins text-[16px] text-[#1a1a2e]">Changes in family members</h3>
					</div>
					<div className="h-[300px]">
						{memberChangesData ? (
							<Bar data={memberChangesData} options={barChartOptions} />
						) : (
							<div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
						)}
					</div>
				</div>

				{/* Total Members and Achievements by Year */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Total Members by Year */}
					<div className="bg-white border-2 border-[rgba(0,0,0,0.25)] rounded-[16px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
						<div className="flex items-center gap-2 mb-4">
							<div className="w-5 h-5 rounded-full bg-[#00a6f4] flex items-center justify-center">
								<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
								</svg>
							</div>
							<h3 className="font-poppins font-medium text-[14px] text-[#364153]">Total members by year</h3>
						</div>
						<div className="h-[200px]">
							{totalMembersByYearData ? (
								<Line data={totalMembersByYearData} options={lineChartOptions} />
							) : (
								<div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
							)}
						</div>
					</div>

					{/* Total Achievements by Year */}
					<div className="bg-white border-2 border-[rgba(0,0,0,0.25)] rounded-[16px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
						<div className="flex items-center gap-2 mb-4">
							<div className="w-5 h-5 rounded-full bg-[#00bc7d] flex items-center justify-center">
								<Trophy className="w-3 h-3 text-white" />
							</div>
							<h3 className="font-poppins font-medium text-[14px] text-[#364153]">Total achievements by year</h3>
						</div>
						<div className="h-[200px]">
							{totalAchievementsByYearData ? (
								<Line data={totalAchievementsByYearData} options={lineChartOptions} />
							) : (
								<div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
							)}
						</div>
					</div>
				</div>

				{/* Achievement Categories */}
				<div className="bg-white border-2 border-[rgba(0,0,0,0.3)] rounded-[16px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
					<div className="flex items-center gap-2 mb-6">
						<div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center">
							<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<circle cx="10" cy="10" r="10" />
							</svg>
						</div>
						<h3 className="font-poppins text-[16px] text-[#1a1a2e]">Achievement Categories</h3>
					</div>

					<div className="flex items-start gap-8">
						{/* Doughnut Chart */}
						<div className="w-55 h-55">
							{achievementCategoriesData.length > 0 ? (
								<Doughnut data={doughnutData} options={doughnutChartOptions} />
							) : (
								<div className="flex items-center justify-center h-full w-full text-gray-400">No data</div>
							)}
						</div>

						{/* Category List */}
						<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{achievementCategoriesData.map((category) => (
								<div
									key={category.name}
									className="bg-[#f9fafb] border border-[rgba(0,0,0,0.3)] rounded-[12px] px-3 py-2 flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
										<span className="font-poppins text-[14px] text-[#1a1a2e]">{category.name}</span>
									</div>
									<div className="border border-[rgba(0,0,0,0.1)] rounded-[12px] px-2 py-0.5">
										<span className="font-poppins font-medium text-[12px] text-[#1a1a2e]">{category.count}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
