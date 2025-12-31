'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, Users, HeartHandshake, Trophy, Network } from 'lucide-react';
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface FamilyTree {
	id: number;
	familyName: string;
}

interface AchievementCategory {
	name: string;
	count: number;
	color: string;
}

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
	const [memberChangesData, setMemberChangesData] = useState<any>(null);
	const [totalMembersByYearData, setTotalMembersByYearData] = useState<any>(null);
	const [totalAchievementsByYearData, setTotalAchievementsByYearData] = useState<any>(null);
	const [achievementCategoriesData, setAchievementCategoriesData] = useState<AchievementCategory[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch family tree
				const treeResponse = await fetch(`/api/family-trees/${familyTreeId}`);
				let tree = null;
				if (treeResponse.ok) {
					tree = await treeResponse.json();
					setFamilyTree(tree);
				}

				// Fetch family members
				const membersResponse = await fetch(`/api/family-members?familyTreeId=${familyTreeId}`);
				if (membersResponse.ok) {
					const members = await membersResponse.json();

					const total = members.length;
					const living = members.filter((m: any) => !m.passingRecords || m.passingRecords.length === 0).length;
					const maxGen = Math.max(...members.map((m: any) => m.generation || 1), 1);

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
					const allAchievements = members.flatMap((member: any) =>
						(member.achievements || []).map((achievement: any) => ({
							...achievement,
							achievementDate: achievement.achieveDate,
							achievementType: achievement.achievementType,
						}))
					);

					setTotalAchievements(allAchievements.length);
					processAchievementsByYear(allAchievements, startYear, currentYear);
					processAchievementCategories(allAchievements);
				}
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

	const processMemberChangesByYear = (members: any[], startYear: number, endYear: number) => {
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
				member.spouseRelationships.forEach((rel: any) => {
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
				member.passingRecords.forEach((record: any) => {
					const year = new Date(record.passingDate).getFullYear();
					if (yearData[year]) {
						yearData[year].deceased++;
					}
				});
			}
		});

		const labels = Object.keys(yearData).sort();
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

	const processTotalMembersByYear = (members: any[], startYear: number, endYear: number) => {
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
					member.passingRecords && member.passingRecords.length > 0
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

	const processAchievementsByYear = (achievements: any[], startYear: number, endYear: number) => {
		const yearCounts: { [key: string]: number } = {};

		// Initialize years
		for (let year = startYear; year <= endYear; year++) {
			yearCounts[year] = 0;
		}

		// Count cumulative achievements by year
		for (let year = startYear; year <= endYear; year++) {
			yearCounts[year] = achievements.filter((achievement) => {
				const achievementYear = achievement.achievementDate
					? new Date(achievement.achievementDate).getFullYear()
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

	const processAchievementCategories = (achievements: any[]) => {
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

		// Statistics Sheet
		const statsData = [
			['Family Tree Report'],
			['Family Name', familyTree?.familyName || ''],
			['Generated On', new Date().toLocaleDateString()],
			[''],
			['Statistics'],
			['Metric', 'Value'],
			['Total Family Members', totalMembers],
			['Current Family Members', currentMembers],
			['Total Achievements', totalAchievements],
			['Generations', generations],
		];
		const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
		XLSX.utils.book_append_sheet(wb, statsSheet, 'Statistics');

		// Member Changes by Year Sheet
		if (memberChangesData) {
			const memberChangesSheetData = [
				['Changes in Family Members by Year'],
				['Year', 'Births', 'Marriages', 'Deaths'],
				...memberChangesData.labels.map((year: string, idx: number) => [
					year,
					memberChangesData.datasets[2].data[idx], // Birth
					memberChangesData.datasets[0].data[idx], // Married
					memberChangesData.datasets[1].data[idx], // Deceased
				]),
			];
			const memberChangesSheet = XLSX.utils.aoa_to_sheet(memberChangesSheetData);
			XLSX.utils.book_append_sheet(wb, memberChangesSheet, 'Member Changes');
		}

		// Total Members by Year Sheet
		if (totalMembersByYearData) {
			const totalMembersSheetData = [
				['Total Members by Year'],
				['Year', 'Total Members'],
				...totalMembersByYearData.labels.map((year: string, idx: number) => [
					year,
					totalMembersByYearData.datasets[0].data[idx],
				]),
			];
			const totalMembersSheet = XLSX.utils.aoa_to_sheet(totalMembersSheetData);
			XLSX.utils.book_append_sheet(wb, totalMembersSheet, 'Total Members');
		}

		// Total Achievements by Year Sheet
		if (totalAchievementsByYearData) {
			const achievementsSheetData = [
				['Total Achievements by Year'],
				['Year', 'Total Achievements'],
				...totalAchievementsByYearData.labels.map((year: string, idx: number) => [
					year,
					totalAchievementsByYearData.datasets[0].data[idx],
				]),
			];
			const achievementsSheet = XLSX.utils.aoa_to_sheet(achievementsSheetData);
			XLSX.utils.book_append_sheet(wb, achievementsSheet, 'Total Achievements');
		}

		// Achievement Categories Sheet
		if (achievementCategoriesData.length > 0) {
			const categoriesSheetData = [
				['Achievement Categories'],
				['Category', 'Count'],
				...achievementCategoriesData.map((cat) => [cat.name, cat.count]),
			];
			const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesSheetData);
			XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Achievement Categories');
		}

		// Save the file
		const fileName = `${familyTree?.familyName || 'FamilyTree'}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
		XLSX.writeFile(wb, fileName);
	};

	const exportToPDF = () => {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		let yPos = 20;

		// Title
		doc.setFontSize(20);
		doc.setFont('helvetica', 'bold');
		doc.text('Family Tree Report', pageWidth / 2, yPos, { align: 'center' });
		yPos += 10;

		// Family name and date
		doc.setFontSize(12);
		doc.setFont('helvetica', 'normal');
		doc.text(`Family: ${familyTree?.familyName || ''}`, 14, yPos);
		yPos += 7;
		doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPos);
		yPos += 15;

		// Statistics
		doc.setFontSize(14);
		doc.setFont('helvetica', 'bold');
		doc.text('Statistics', 14, yPos);
		yPos += 7;

		const statsTableData = [
			['Total Family Members', totalMembers.toString()],
			['Current Family Members', currentMembers.toString()],
			['Total Achievements', totalAchievements.toString()],
			['Generations', generations.toString()],
		];

		autoTable(doc, {
			startY: yPos,
			head: [['Metric', 'Value']],
			body: statsTableData,
			theme: 'grid',
			headStyles: { fillColor: [41, 128, 185] },
			margin: { left: 14 },
		});

		yPos = (doc as any).lastAutoTable.finalY + 15;

		// Member Changes by Year
		if (memberChangesData) {
			if (yPos > 250) {
				doc.addPage();
				yPos = 20;
			}
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('Changes in Family Members by Year', 14, yPos);
			yPos += 7;

			const memberChangesTableData = memberChangesData.labels.map((year: string, idx: number) => [
				year,
				memberChangesData.datasets[2].data[idx].toString(), // Birth
				memberChangesData.datasets[0].data[idx].toString(), // Married
				memberChangesData.datasets[1].data[idx].toString(), // Deceased
			]);

			autoTable(doc, {
				startY: yPos,
				head: [['Year', 'Births', 'Marriages', 'Deaths']],
				body: memberChangesTableData,
				theme: 'grid',
				headStyles: { fillColor: [41, 128, 185] },
				margin: { left: 14 },
			});

			yPos = (doc as any).lastAutoTable.finalY + 15;
		}

		// Total Members by Year
		if (totalMembersByYearData) {
			if (yPos > 250) {
				doc.addPage();
				yPos = 20;
			}
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('Total Members by Year', 14, yPos);
			yPos += 7;

			const totalMembersTableData = totalMembersByYearData.labels.map((year: string, idx: number) => [
				year,
				totalMembersByYearData.datasets[0].data[idx].toString(),
			]);

			autoTable(doc, {
				startY: yPos,
				head: [['Year', 'Total Members']],
				body: totalMembersTableData,
				theme: 'grid',
				headStyles: { fillColor: [41, 128, 185] },
				margin: { left: 14 },
			});

			yPos = (doc as any).lastAutoTable.finalY + 15;
		}

		// Total Achievements by Year
		if (totalAchievementsByYearData) {
			if (yPos > 250) {
				doc.addPage();
				yPos = 20;
			}
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('Total Achievements by Year', 14, yPos);
			yPos += 7;

			const achievementsTableData = totalAchievementsByYearData.labels.map((year: string, idx: number) => [
				year,
				totalAchievementsByYearData.datasets[0].data[idx].toString(),
			]);

			autoTable(doc, {
				startY: yPos,
				head: [['Year', 'Total Achievements']],
				body: achievementsTableData,
				theme: 'grid',
				headStyles: { fillColor: [41, 128, 185] },
				margin: { left: 14 },
			});

			yPos = (doc as any).lastAutoTable.finalY + 15;
		}

		// Achievement Categories
		if (achievementCategoriesData.length > 0) {
			if (yPos > 250) {
				doc.addPage();
				yPos = 20;
			}
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('Achievement Categories', 14, yPos);
			yPos += 7;

			const categoriesTableData = achievementCategoriesData.map((cat) => [cat.name, cat.count.toString()]);

			autoTable(doc, {
				startY: yPos,
				head: [['Category', 'Count']],
				body: categoriesTableData,
				theme: 'grid',
				headStyles: { fillColor: [41, 128, 185] },
				margin: { left: 14 },
			});
		}

		// Save the file
		const fileName = `${familyTree?.familyName || 'FamilyTree'}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
		doc.save(fileName);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<Loader2 className="animate-spin h-12 w-12 text-gray-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading reports...</p>
				</div>
			</div>
		);
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
		<div className="flex-1 overflow-y-auto p-4 lg:p-8">
			<div className="max-w-[1158px] mx-auto space-y-[74px]">
				{/* Export Buttons */}
				<div className="flex justify-end gap-3">
					<div className=" border border-[rgba(0,0,0,0.5)] rounded-[25px] flex items-center gap-2 p-1">
						<button className="px-4 py-2 text-[16px] font-inter text-black">Export Report</button>
						<button
							onClick={() => exportReport('excel')}
							className="px-6 py-2 bg-[#f8f8f8] border border-[rgba(0,0,0,0.5)] rounded-[25px] text-[16px] font-inter text-black hover:bg-gray-200 transition-colors"
						>
							Excel
						</button>
						<button
							onClick={() => exportReport('pdf')}
							className="px-6 py-2 bg-[#f8f8f8] border border-[rgba(0,0,0,0.5)] rounded-[25px] text-[16px] font-inter text-black hover:bg-gray-200 transition-colors"
						>
							PDF
						</button>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[52px]">
					{/* Total Family Members */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
						<Users className="w-9 h-6 text-black mb-4" />
						<h3 className="font-inter font-bold text-[16px] text-black mb-2">Total family members</h3>
						<p className="font-inter text-[40px] text-black">{totalMembers}</p>
					</div>

					{/* Current Family Members */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
						<HeartHandshake className="w-9 h-8 text-black mb-4" />
						<h3 className="font-inter font-bold text-[16px] text-black mb-2">Current family members</h3>
						<p className="font-inter text-[40px] text-black">{currentMembers}</p>
					</div>

					{/* Achievements */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
						<Trophy className="w-8 h-8 text-black mb-4" />
						<h3 className="font-inter font-bold text-[16px] text-black mb-2">Achievements</h3>
						<p className="font-inter text-[40px] text-black">{totalAchievements}</p>
					</div>

					{/* Generations */}
					<div className="border-2 border-[rgba(0,0,0,0.25)] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] p-6">
						<Network className="w-9 h-8 text-black mb-4" />
						<h3 className="font-inter font-bold text-[16px] text-black mb-2">Generations</h3>
						<p className="font-inter text-[40px] text-black">{generations}</p>
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
