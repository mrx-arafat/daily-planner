import { toast } from "@/components/ui/use-toast";

interface GistContent {
  [key: string]: {
    content: string;
  };
}

interface GistData {
  files: GistContent;
  description: string;
}

const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID;
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

export async function saveToGist(date: string, data: any) {
  if (!GIST_ID || !GITHUB_TOKEN) {
    // Fallback to localStorage if no Gist configuration
    localStorage.setItem(`planner-${date}`, JSON.stringify(data));
    return;
  }

  try {
    const filename = `planner-${date}.json`;
    const gistData: GistData = {
      description: `Daily Planner Data for ${date}`,
      files: {
        [filename]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    };

    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gistData),
    });

    if (!response.ok) {
      throw new Error("Failed to save to Gist");
    }

    toast({
      title: "Saved successfully",
      description: `Your planner for ${date} has been saved to cloud.`,
    });
  } catch (error) {
    console.error("Error saving to Gist:", error);
    // Fallback to localStorage
    localStorage.setItem(`planner-${date}`, JSON.stringify(data));
    toast({
      title: "Cloud save failed",
      description: "Data saved locally. Please check your internet connection.",
      variant: "destructive",
    });
  }
}

export async function loadFromGist(date: string) {
  if (!GIST_ID || !GITHUB_TOKEN) {
    // Fallback to localStorage if no Gist configuration
    return JSON.parse(localStorage.getItem(`planner-${date}`) || "null");
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load from Gist");
    }

    const gistData: GistData = await response.json();
    const filename = `planner-${date}.json`;

    if (gistData.files[filename]) {
      return JSON.parse(gistData.files[filename].content);
    }

    return null;
  } catch (error) {
    console.error("Error loading from Gist:", error);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem(`planner-${date}`) || "null");
  }
}

export async function getAllPlannerDates() {
  if (!GIST_ID || !GITHUB_TOKEN) {
    // Fallback to localStorage if no Gist configuration
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("planner-"))
      .map((key) => key.replace("planner-", ""));
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load from Gist");
    }

    const gistData: GistData = await response.json();
    return Object.keys(gistData.files)
      .filter((filename) => filename.startsWith("planner-"))
      .map((filename) => filename.replace("planner-", "").replace(".json", ""));
  } catch (error) {
    console.error("Error loading dates from Gist:", error);
    // Fallback to localStorage
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("planner-"))
      .map((key) => key.replace("planner-", ""));
  }
}
