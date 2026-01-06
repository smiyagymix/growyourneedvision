import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface CourseMaterial {
    id: string;
    name: string;
    file: string;
    size: number;
    created: string;
    course_id: string;
    type: string;
}

const MOCK_MATERIALS: CourseMaterial[] = [
    {
        id: 'mat_1',
        name: 'Chapter 1 - Algebra Fundamentals.pdf',
        file: 'algebra_ch1.pdf',
        size: 2456789,
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        course_id: 'class_1',
        type: 'course_material'
    },
    {
        id: 'mat_2',
        name: 'Practice Problems Set 1.pdf',
        file: 'practice_set1.pdf',
        size: 1234567,
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        course_id: 'class_1',
        type: 'course_material'
    },
    {
        id: 'mat_3',
        name: 'Shakespeare Analysis Guide.pdf',
        file: 'shakespeare_guide.pdf',
        size: 3456789,
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        course_id: 'class_2',
        type: 'course_material'
    },
    {
        id: 'mat_4',
        name: 'Physics Lab Manual.pdf',
        file: 'physics_lab_manual.pdf',
        size: 5678901,
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        course_id: 'class_3',
        type: 'course_material'
    },
    {
        id: 'mat_5',
        name: 'Motion Equations Reference.pdf',
        file: 'motion_equations.pdf',
        size: 890123,
        created: new Date().toISOString(),
        course_id: 'class_3',
        type: 'course_material'
    }
];

export const courseMaterialsService = {
    /**
     * Get all course materials for student
     */
    async getCourseMaterials(): Promise<CourseMaterial[]> {
        if (isMockEnv()) {
            return MOCK_MATERIALS;
        }

        try {
            const materials = await pb.collection('file_uploads').getFullList<CourseMaterial>({
                filter: 'course_id != null && type = "course_material"',
                sort: '-created',
                requestKey: null
            });
            return materials;
        } catch (error) {
            console.error('Error fetching course materials:', error);
            return [];
        }
    },

    /**
     * Get materials for a specific course
     */
    async getMaterialsByCourse(courseId: string): Promise<CourseMaterial[]> {
        if (isMockEnv()) {
            return MOCK_MATERIALS.filter(m => m.course_id === courseId);
        }

        try {
            const materials = await pb.collection('file_uploads').getFullList<CourseMaterial>({
                filter: `course_id = "${courseId}" && type = "course_material"`,
                sort: '-created',
                requestKey: null
            });
            return materials;
        } catch (error) {
            console.error('Error fetching course materials:', error);
            return [];
        }
    },

    /**
     * Get download URL for a material
     */
    getDownloadUrl(material: CourseMaterial): string {
        if (isMockEnv()) {
            return `#mock-download-${material.id}`;
        }
        return pb.files.getUrl(material as any, material.file);
    }
};
