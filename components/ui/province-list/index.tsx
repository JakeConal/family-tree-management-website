const list = [
	'An Giang',
	'Ba Ria – Vung Tau',
	'Bac Giang',
	'Bac Ninh',
	'Binh Duong',
	'Binh Dinh',
	'Binh Phuoc',
	'Binh Thuan',
	'Ca Mau',
	'Dak Lak',
	'Dak Nong',
	'Dong Nai',
	'Dong Thap',
	'Gia Lai',
	'Ha Giang',
	'Ha Nam',
	'Ha Tinh',
	'Khanh Hoa',
	'Kien Giang',
	'Lam Dong',
	'Lao Cai',
	'Long An',
	'Nam Dinh',
	'Nghe An',
	'Ninh Binh',
	'Phu Tho',
	'Quang Nam',
	'Hanoi',
	'Ho Chi Minh City',
	'Hai Phong',
	'Da Nang',
	'Can Tho',
	'Hue',
];

export default function ProvinceList() {
	return (
		<>
			{list.map((province) => (
				<option key={province} value={province}>
					{province}
				</option>
			))}
		</>
	);
}
