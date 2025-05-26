import React, { useContext, createContext, ReactNode } from 'react';
import { useAddress, useContract, useContractWrite, useConnect, metamaskWallet } from '@thirdweb-dev/react';

import { ethers } from 'ethers';

const StateContext = createContext<any>(null);

interface StateContextProviderProps {
  children: ReactNode;
}

export const StateContextProvider = ({ children }: StateContextProviderProps) => {
  const { contract } = useContract('0x4d76965C709f19Bfd2f6C329de0b4dED9Bd6890E');

  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

  const address = useAddress();
  const connect = useConnect();

  const publishCampaign = async (form: any) => {
    if (!createCampaign) {
      console.error('Contract not ready');
      return;
    }
    try {
      const data = await createCampaign({
        args: [
          address,
          form.title,
          form.description,
          form.target,
          new Date(form.deadline).getTime(),
          form.image,
        ],
      });
      console.log('Contract call success', data);
    } catch (error) {
      console.error('Contract call failure', error);
    }
  };
  const connectWithMetamask = async () => {
    await connect(metamaskWallet());
  };
  const getCampaigns = async () => {
    if (!contract) return [];
    // const { contract } = useStateContext();
    
    const campaigns = await contract.call('getCampaigns');
  
    const parsedCampaigns = campaigns.map((campaign: any, i: number) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i,
    }));
  
    return parsedCampaigns;
  };
  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    const filteredCampaigns = allCampaigns.filter((campaign: any) => campaign.owner === address);
    return filteredCampaigns;
  };
  
  // const getUserCampaigns = async () => {
  //   const { address } = useStateContext();
  //   const allCampaigns = await getCampaigns();
  
  //   const filteredCampaigns = allCampaigns.filter((campaign: any) => campaign.owner === address);
  
  //   return filteredCampaigns;
  // };
  
  const donate = async (pId: any, amount: any) => {
    if (!contract) return;
    const data = await contract.call('donateToCampaign', [pId], {
      value: ethers.utils.parseEther(amount),
    });
  
    return data;
  };
  
  const getDonations = async (pId: any) => {
    if (!contract) return [];

    // const { contract } = useStateContext();
    const donations = await contract.call('getDonators', [pId]);
    const numberOfDonations = donations[0].length;
  
    const parsedDonations = [];
  
    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      });
    }
  
    return parsedDonations;
  };
  

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect: connectWithMetamask,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}
export const useStateContext = () => useContext(StateContext);