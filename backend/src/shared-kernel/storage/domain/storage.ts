export class StoredImage {
    constructor(
        public readonly publicId: string,
        public readonly url: string,
    ) {
        if (!publicId || !url) {
            throw new Error(
                "StoredImage invalid: publicId and url are required.",
            );
        }
    }
}
