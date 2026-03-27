import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const skillsPath = path.resolve(process.cwd(), '../../skills');
    
    // Find all SKILL.md files up to 2 levels deep
    const cmd = `find ${skillsPath} -maxdepth 3 -name "SKILL.md" -type f`;
    const result = execSync(cmd).toString().trim().split('\n');
    
    const parsedSkills = result.filter(f => f).map(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const nameMatch = content.match(/name:\s*"?([^"\n]+)"?/);
      const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
      
      const dirName = path.basename(path.dirname(filePath));
      const parentDirName = path.basename(path.dirname(path.dirname(filePath)));
      
      let category = parentDirName === 'skills' ? 'Core' : parentDirName;
      if (category === 'gws') category = 'Google Workspace';
      if (category === 'github' || category === 'vercel-cli') category = 'DevOps';
      if (category === 'datahub-analytics' || category === 'b2b-analytics') category = 'Business';
      
      return {
        id: nameMatch ? nameMatch[1] : dirName,
        name: nameMatch ? nameMatch[1] : dirName,
        description: descMatch ? descMatch[1] : 'No description provided.',
        category: category.charAt(0).toUpperCase() + category.slice(1),
        path: filePath
      };
    });

    return NextResponse.json({ skills: parsedSkills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}
