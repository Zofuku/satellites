const networkId = 1
const relayer = 'https://relayer-mainnet.nftsatellites.com/v2/'
const ga = 'UA-130401695-4'
const feeBase = 10000
const feePer = 100
const satellitesAddress = '0x764Fe0b6dF8575b30bCfd0c9Bb2A7ADb390b5359'
const satellitesFeeRatio = 100
const ownerAddress = '0xB22D813bE873aFFc6C3b92BeCd87455cE2aFF54d'
const ownerFeeRatio = 900

const networkIdToInfura: { [networkId: number]: string } = {
  1: 'https://mainnet.infura.io/',
  4: 'https://rinkeby.infura.io/'
}

const networkIdToEtherscan: { [networkId: number]: string } = {
  1: 'https://etherscan.io/tx/',
  4: 'https://rinkeby.etherscan.io/tx/'
}

const networkIdToAPI: { [networkId: number]: string } = {
  1: `https://api.opensea.io/api/v1/`,
  4: `https://rinkeby-api.opensea.io/api/v1/`
}

const networkIdToTokens: { [networkId: number]: any[] } = {
  1: {
    {
      contract: '0x273f7f8e6489682df756151f5525576e322d51a3',
      symbol: 'MCHH',
      name: 'MyCryptoHeroes:Hero'
    },
    {
      contract: '0xdceaf1652a131f32a821468dc03a92df0edd86ea',
      symbol: 'MCHE',
      name: 'MyCryptoHeroes:Extensions'
    },
    {
      contract: '0x617913Dd43dbDf4236B85Ec7BdF9aDFD7E35b340',
      symbol: 'MCHL',
      name: 'MyCryptoHeroes:Land'
    },
    {
       contract: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
       symbol: 'LAND',
       name: 'Decentraland LAND'
     },
    {
      contract: '0xf5b0a3efb8e8e4c201e2a935f110eaaf3ffecb8d',
      symbol: 'AXIE',
      name: 'AXIE'
    },
    {
      contract: '0xfac7bea255a6990f749363002136af6556b31e04',
      symbol: 'ENS',
      name: 'Ether Name Service'
    },
    {
      contract: '0x79986af15539de2db9a5086382daeda917a9cf0c',
      symbol: 'CVPA',
      name: 'Cryptovoxels Parcel'
    },
    {
       contract: '0x8c9b261faef3b3c2e64ab5e58e04615f8c788099',
       symbol: 'MLBCB',
       name: 'MLB Champions'
     },
     {
       contract: '0x67cbbb366a51fff9ad869d027e496ba49f5f6d55',
       symbol: 'CSPL',
       name: 'CryptoSpells'
     },
　　　{
       contract: '0x4d3814D4DA8083b41861dEC2F45B4840e8b72d68',
       symbol: 'CSCNFT',
       name: 'CSCNFTFactory'
     },
}
  4: [
    {
      contract: '0x84f6261350151dc9cbf5b33c5354fe9a82166e26',
      symbol: 'BBB',
      name: 'BB Batch'
    }
  ]
}

const feeDistribution = [
  // first fee recipient is satellites address. This Fee goes to issueHunt and is returned to the developer.
  {
    recipient: satellitesAddress,
    ratio: satellitesFeeRatio
  },
  {
    recipient: ownerAddress,
    ratio: ownerFeeRatio
  }
]

let defaultRatio = 0

for (let i = 0; i < feeDistribution.length; i++) {
  defaultRatio += Number(feeDistribution[i].ratio)
}

const whitelists: any[] = []
for (let i = 0; i < networkIdToTokens[networkId].length; i++) {
  whitelists.push(networkIdToTokens[networkId][i].contract)
}

export const config = {
  networkId: networkId,
  relayer: relayer,
  ga: ga,
  infura: networkIdToInfura[networkId],
  etherscan: networkIdToEtherscan[networkId],
  api: networkIdToAPI[networkId],
  tokens: networkIdToTokens[networkId],
  whitelists: whitelists,
  feeDistribution: feeDistribution,
  defaultRatio: defaultRatio,
  feeBase: feeBase,
  feePer: feePer
}
