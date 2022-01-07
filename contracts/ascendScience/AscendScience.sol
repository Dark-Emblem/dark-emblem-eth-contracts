// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract AscendScience {
    bool public constant IS_ASCEND_SCIENCE = true;

    uint256 internal constant NUM_TRAITS = TRAIT_SIZE / 4;
    uint256 internal constant TRAIT_SIZE = 48;
    uint256 internal constant NUM_BITS_IN_MASKS = 32;

    constructor() {}

    function _ascend(
        uint8 trait1,
        uint8 trait2,
        uint256 rand
    ) internal pure returns (uint8 ascension) {
        ascension = 0;

        uint8 smallT = trait1;
        uint8 bigT = trait2;

        if (smallT > bigT) {
            bigT = trait1;
            smallT = trait2;
        }

        if ((bigT - smallT == 1) && smallT % 2 == 0) {
            // The rand argument is expected to be a random number 0-7.
            // 1st and 2nd tier: 1/4 chance (rand is 0 or 1)
            // 3rd and 4th tier: 1/8 chance (rand is 0)

            // must be at least this much to ascend
            uint256 maxRand;
            if (smallT < 23) maxRand = 1;
            else maxRand = 0;

            if (rand <= maxRand) {
                ascension = (smallT / 2) + 16;
            }
        }
    }

    function _sliceNumber(
        uint256 _n,
        uint256 _nbits,
        uint256 _offset
    ) private pure returns (uint256) {
        // mask is made by shifting left an offset number of times
        uint256 mask = uint256((2**_nbits) - 1) << _offset;
        // AND n with mask, and trim to max of _nbits bits
        return uint256((_n & mask) >> _offset);
    }

    function _get5Bits(uint256 _input, uint256 _slot)
        internal
        pure
        returns (uint8)
    {
        return uint8(_sliceNumber(_input, uint256(5), _slot * 5));
    }

    function decode(uint256 genes) public pure returns (uint8[] memory) {
        uint8[] memory traits = new uint8[](TRAIT_SIZE);
        uint256 i;
        for (i = 0; i < TRAIT_SIZE; i++) {
            traits[i] = _get5Bits(genes, i);
        }
        return traits;
    }

    function encode(uint8[] memory traits)
        public
        pure
        returns (uint256 _genes)
    {
        _genes = 0;
        for (uint256 i = 0; i < TRAIT_SIZE; i++) {
            _genes = _genes << 5;
            // bitwise OR trait with _genes
            _genes = _genes | traits[TRAIT_SIZE - 1 - i];
        }
        return _genes;
    }

    /// @dev add a target set of bits to a set of traits
    function addBits(
        uint256 traits,
        uint256 boost,
        uint256 nonce
    ) internal pure returns (uint256) {
        uint256 numIterations = boost / NUM_BITS_IN_MASKS;

        uint256 mask = 0;

        for (uint256 i = 0; i < numIterations; i++) {
            uint256 r = uint256(keccak256(abi.encodePacked(i, nonce)));

            for (uint256 j = 0; j < NUM_BITS_IN_MASKS; j++) {
                // Get an 8 bit slice of r, at offset j
                uint256 shift = _sliceNumber(r, uint256(8), j * 8);

                mask = mask | (1 << shift);
            }
        }

        // Add the mask to the traits with an OR
        return traits | mask;
    }

    function mixTraits(
        uint256 genes1,
        uint256 genes2,
        uint256 nonce
    ) external pure returns (uint256) {
        uint256 randomN = uint256(
            keccak256(abi.encodePacked(genes1, genes2, nonce))
        );
        uint256 randomIndex = 0;

        uint8[] memory genesArray1 = decode(genes1);
        uint8[] memory genesArray2 = decode(genes2);
        // All traits that will belong to baby
        uint8[] memory babyArray = new uint8[](TRAIT_SIZE);
        // A pointer to the trait we are dealing with currently
        uint256 traitPos;
        // Trait swap value holder
        uint8 swap;
        // iterate all NUM_TRAITS characteristics
        for (uint256 i = 0; i < NUM_TRAITS; i++) {
            // pick 4 traits for characteristic i
            uint256 j;
            // store the current random value
            uint256 rand;
            for (j = 3; j >= 1; j--) {
                traitPos = (i * 4) + j;

                rand = _sliceNumber(randomN, 2, randomIndex); // 0~3
                randomIndex += 2;

                // 1/4 of a chance of gene swapping forward towards expressing.
                if (rand == 0) {
                    // do it for parent 1
                    swap = genesArray1[traitPos];
                    genesArray1[traitPos] = genesArray1[traitPos - 1];
                    genesArray1[traitPos - 1] = swap;
                }

                rand = _sliceNumber(randomN, 2, randomIndex); // 0~3
                randomIndex += 2;

                if (rand == 0) {
                    // do it for parent 2
                    swap = genesArray2[traitPos];
                    genesArray2[traitPos] = genesArray2[traitPos - 1];
                    genesArray2[traitPos - 1] = swap;
                }
            }
        }

        for (traitPos = 0; traitPos < TRAIT_SIZE; traitPos++) {
            // See if this trait pair should ascend
            uint8 ascendedTrait = 0;
            uint256 rand;

            // There are two checks here. The first is straightforward, only the trait
            // in the first slot can ascend. The first slot is zero mod 4.
            //
            // The second check is more subtle: Only values that are one apart can ascend,
            // which is what we check inside the _ascend method. However, this simple mask
            // and compare is very cheap (9 gas) and will filter out about half of the
            // non-ascending pairs without a function call.
            //
            // The comparison itself just checks that one value is even, and the other
            // is odd.
            if (
                (traitPos % 4 == 0) &&
                (genesArray1[traitPos] & 1) != (genesArray2[traitPos] & 1)
            ) {
                rand = _sliceNumber(randomN, 3, randomIndex);
                randomIndex += 3;

                ascendedTrait = _ascend(
                    genesArray1[traitPos],
                    genesArray2[traitPos],
                    rand
                );
            }

            if (ascendedTrait > 0) {
                babyArray[traitPos] = uint8(ascendedTrait);
            } else {
                // did not ascend, pick one of the parent's traits for the baby
                // We use the top bit of rand for this (the bottom three bits were used
                // to check for the ascension itself).
                rand = _sliceNumber(randomN, 1, randomIndex);
                randomIndex += 1;

                if (rand == 0) {
                    babyArray[traitPos] = uint8(genesArray1[traitPos]);
                } else {
                    babyArray[traitPos] = uint8(genesArray2[traitPos]);
                }
            }
        }

        return addBits(encode(babyArray), 40, nonce);
    }

    function transmogrifyTraits(
        uint256 trait1,
        uint256 trait2,
        uint256 trait3,
        uint256 nonce
    ) external view returns (uint256) {
        return
            this.mixTraits(
                this.mixTraits(trait1, trait2, nonce),
                trait3,
                nonce
            );
    }

    function getRandomTraits(
        uint256 salt1,
        uint256 salt2,
        uint256 boost
    ) external view returns (uint256) {
        bytes32 x = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.number,
                msg.sender,
                salt1,
                salt2
            )
        );

        uint256 r = addBits(uint256(x), boost, salt1);
        return r;
    }
}
