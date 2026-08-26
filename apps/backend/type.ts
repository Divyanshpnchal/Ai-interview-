import z from "zod";




const schemadesign = z.object({
    gitlink: z.string().url().refine(
    (val) => /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/.test(val),
    { message: "Must be a valid GitHub profile URL" }
    )

})

export default schemadesign ;