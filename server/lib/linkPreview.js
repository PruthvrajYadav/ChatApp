import ogs from "open-graph-scraper";

export const getPreview = async (text) => {
    try {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const url = text.match(urlRegex)?.[0];
        
        if (!url) return null;

        const options = { url };
        const { error, result } = await ogs(options);
        
        if (error) return null;

        return {
            title: result.ogTitle || result.twitterTitle || "",
            description: result.ogDescription || result.twitterDescription || "",
            image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "",
            url: result.ogUrl || url
        };
    } catch (error) {
        console.log("Link preview error:", error.message);
        return null;
    }
};
