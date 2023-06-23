import React, { useContext, createContext } from 'react';
import { ethers } from 'ethers';

import { useAddress, useMetamask } from '@thirdweb-dev/react';
import CrowdFundingABI from './CrowdFunding.json';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const contractAddress = '0xcE9C85582986742Ba824F8d932187fA0E6ba7E80';
const contract = new ethers.Contract(contractAddress, CrowdFundingABI.abi, signer);

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try {
      const tx = await contract.createCampaign(
        address,
        form.title,
        form.description,
        form.target,
        new Date(form.deadline).getTime(),
        form.image
      );
      await tx.wait();
      console.log("Contract call success");
    } catch (error) {
      console.log("Contract call failure", error);
    }
  };

  

  const getCampaigns = async () => {
    const campaigns = await contract.getCampaigns();
    const parsedCampaigns = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));
    return parsedCampaigns;
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

    return filteredCampaigns;
  };

  const donate = async (pId, amount) => {
    try {
      const tx = await contract.donateToCampaign(pId, { value: ethers.utils.parseEther(amount) });
      await tx.wait();
      console.log("Donation successful");
    } catch (error) {
      console.log("Donation failed", error);
    }
  };

  const getDonations = async (pId) => {
    const donations = await contract.getDonators(pId);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      });
    }

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
