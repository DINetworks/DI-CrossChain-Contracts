describe("IXFI GMP Protocol Complete Test", function () {
    let oracle;
    
    beforeEach(async function () {
        [owner] = await ethers.getSigners();


        oracle = await ethers.getContractAt("IDIAOracle", "0x8E96c524115496f36e92e7fbF32416cd8Df2F8fD");
        
    });

    it("Should fetch xUSD price from DIA Oracle", async function () {
        const result = await oracle.getValue("XFI/USD");
        const price = result[0];
        const timestamp = result[1];

        console.log('xUSD price:', price.toString());
        console.log('timestamp:', timestamp.toString());

        expect(price).to.be.gt(0);
        expect(timestamp).to.be.gt(0);
    })

});
