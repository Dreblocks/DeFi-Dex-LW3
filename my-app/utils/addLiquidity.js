import {Contract, utils} from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

// addLiquidity is used to call the addLiquidity function in the contract to add liquidity
//It also gets the Crypto Dev tokens approved for the contract by the user. The reason why Crypto Dev tokens need approval is because they are an ERC20 token.
// For the contract to withdraw an ERC20 from a user's account, it needs the approval from the user's account

/**
 * addLiquidity helps add liquidity to the exchange,
 * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
 * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
 * then we calculate the Crypto Dev tokens he can add, given the Eth he wants to add by keeping the ratios
 * constant
 */


export const addLiquidity = async (
    signer,
    addCDAmountWei,
    AddEtherAmountWei
) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_ADDRESS_ABI,
            signer
        );
        // Because CD tokens are an ERC20, user would need to give the contract allowance
    // to take the required number CD tokens out of his contract
        let tx = await tokenContract.approve( 
            EXCHANGE_CONTRACT_ADDRESS,
            addCDAmountWei.toString()
        );
        await tx.wait();
        tx = await EXCHANGE_CONTRACT_ABI.addLiquidity(addCDAmountWei, {
            value: AddEtherAmountWei,
        });
        //tx.wait() means we are waiting for the transaction to get mined
        await tx.wait();
    } catch (err) {
        console.error(err);
    }
};

//calculateCD tells you for a given amount of Eth, how many Crypto Dev tokens can be added to the liquidity

//We calculate this by maintaining a ratio. The ratio we follow is (amount of Crypto Dev tokens to be added) / (Crypto Dev tokens balance) = (Eth that would be added) / (Eth reserve in the contract)

//So by maths we get (amount of Crypto Dev tokens to be added) = (Eth that would be added * Crypto Dev tokens balance) / (Eth reserve in the contract)


// calculateCD calculates the CD tokens that need to be added to the liquidity given `_addEtherAmountWei` amount of ether
export const calculateCD = async (
    _addEther = "0",
    etherBalanceContract,
    cdTokenReserve
) => {
   // `_addEther` is a string, we need to convert it to a Bignumber before we can do our calculations
  // We do that using the `parseEther` function from `ethers.js`
    const _addEtherAmountWei = utils.parseEther(_addEther);


   // Ratio needs to be maintained when we add liquidty.
  // We need to let the user know for a specific amount of ether how many `CD` tokens
  // He can add so that the price impact is not large
  // The ratio we follow is (amount of Crypto Dev tokens to be added) / (Crypto Dev tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
  // So by maths we get (amount of Crypto Dev tokens to be added) = (Eth that would be added * Crypto Dev tokens balance) / (Eth reserve in the contract)

    const cryptoDevTokenAmount = _addEtherAmountWei
       .mul(cdTokenReserve)
       .div(etherBalanceContract);
    return cryptoDevTokenAmount;
};