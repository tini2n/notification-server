export const CONTRACT_MOCK = {
	'$@': 'SMC',
	$in: [['*', '@gmctugnw/N6d/lZOEveFn+kutsWpIL2KQOzJuJiFO1Q=']],
	$out: [
		['*', '@A8oIcj8C3oRwcAQ3xjSV4a0EhFzRlvTCHtOdZfropuez'],
		['*', '@AvfAMZutBLfOl0zFIiz8Oc5HL7JpdyIv0Y/cCKMgOaX/'],
	],
	$read: {},
	$script: '2 498 2 pay',
};

export const UTIL_HIBON_PARSED = {
	message: {
		id: ['u32', 2235161016],
		method: 'transaction',
		params: {
			'$@': 'SSC',
			$contract: {
				'$@': 'SMC',
				$in: [['*', '@gmctugnw/N6d/lZOEveFn+kutsWpIL2KQOzJuJiFO1Q=']],
				$out: [
					['*', '@A8oIcj8C3oRwcAQ3xjSV4a0EhFzRlvTCHtOdZfropuez'],
					['*', '@AvfAMZutBLfOl0zFIiz8Oc5HL7JpdyIv0Y/cCKMgOaX/'],
				],
				$read: {},
				$script: '2 498 2 pay',
			},
			$in: [
				{
					'$@': 'BIL',
					$T: 'TGN',
					$V: ['u64', '0x1f4'],
					$Y: ['*', '@A3yqXQe48Q6wu780JXZ8LPe+FglGNgxX0bNHSbj9rFp/'],
					$k: ['u32', 525],
				},
			],
			$signs: [
				['*', '@xaxbwCs/PzncN7uanp1E6zTlef2DfvtqJIT3fM51zw48+OOXLmEp33HtKy8MbYpfvltde6WgfcifLBG7hNgQuA=='],
			],
		},
	},
};
