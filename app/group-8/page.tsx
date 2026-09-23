const members = [
    {
        id: 1,
        name: "Ngu Eain Zin",
        email: "ngu.zin@torontomu.ca"
    },
    {
        id: 2,
        name: "William Khine",
        email: "pyae.khine@torontomu.ca"
    },
    {
        id: 3,
        name: "Vyshnavi Vijendran",
        email: "vysh03@torontomu.ca?"
    },
]

export default function Page() {
    return (
        <div className="flex justify-center items-center p-6">
            <div className="container flex flex-col gap-4">
            {members.map((member) => (
                <div key={member.id} className="mr-4">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
            ))}
            </div>
        </div>
    )
}